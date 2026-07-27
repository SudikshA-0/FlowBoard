from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import logging
import os
import random
import sys
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Logging — werkzeug access lines + structured ML debug on stdout
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%H:%M:%S",
    stream=sys.stdout,
    force=True,
)
logger = logging.getLogger("flowboard.ml")
# Ensure Flask/Werkzeug HTTP access logs are not suppressed
logging.getLogger("werkzeug").setLevel(logging.INFO)

app = Flask(__name__)
CORS(app)

logger.info("Running file: %s", os.path.abspath(__file__))
logger.info("Loading ML model from delay_model.pkl")
model = joblib.load("delay_model.pkl")
logger.info("Model loaded: %s", type(model).__name__)

priority_map = {'low': 0, 'medium': 1, 'high': 2}


def normalize_status(raw):
    """Canonical: todo | in progress | done (accepts inprogress, in-progress, etc.)."""
    if raw is None or raw == "":
        return "todo"
    s = "".join(str(raw).strip().lower().split()).replace("-", "")
    if s == "inprogress":
        return "in progress"
    if s == "done":
        return "done"
    return "todo"


REASON_POOLS = {
    "time_urgency": [
        "Deadline is approaching rapidly.",
        "Limited buffer time remains before due date.",
        "Task is nearing its due window.",
        "Very little time is left to complete this work.",
        "Time constraints are becoming critical.",
        "The remaining timeline is tight.",
        "Delivery window is closing soon.",
        "Current pace may not be enough for on-time completion.",
        "Execution time is shorter than expected.",
        "Minimal schedule flexibility is available now.",
    ],
    "overdue": [
        "This task is already past its due date.",
        "Planned completion window has been exceeded.",
        "Schedule slippage has already occurred.",
        "Deadline has elapsed without closure.",
        "The task is in delayed territory now.",
        "Target date has passed and risk is elevated.",
        "Overdue status indicates unresolved execution blockers.",
        "Missed due date suggests timeline instability.",
    ],
    "priority_impact": [
        "High-priority tasks often involve greater complexity.",
        "Priority level increases delivery pressure.",
        "Business-critical scope can introduce execution risk.",
        "Urgency requirements reduce margin for error.",
        "Higher priority usually carries broader dependency impact.",
        "Critical tasks tend to require tighter coordination.",
        "Priority expectations raise risk sensitivity.",
        "Escalated importance can increase rework risk.",
    ],
    "risk_pattern": [
        "Current signal pattern aligns with delay-prone cases.",
        "Risk indicators match previously delayed tasks.",
        "The feature profile suggests elevated schedule risk.",
        "Observed timing pattern correlates with slippage.",
        "Model inputs indicate unstable delivery probability.",
        "Current trend maps to moderate-to-high delay likelihood.",
        "Existing schedule signals resemble known late completions.",
        "Prediction profile reflects heightened completion uncertainty.",
    ],
    "workload_behavior": [
        "Workload trend suggests possible execution bottlenecks.",
        "Task progression appears slower than ideal.",
        "Current pace indicates potential delivery friction.",
        "Coordination overhead may affect completion speed.",
        "Competing priorities can reduce focused execution time.",
        "Execution flow may be impacted by context switching.",
        "Throughput pattern indicates a possible slowdown.",
        "Workload pressure may reduce schedule reliability.",
    ],
    "uncertainty/context": [
        "Missing context details increase estimation uncertainty.",
        "Unclear scope boundaries can affect timeline predictability.",
        "Dependency visibility appears limited at this stage.",
        "Current assumptions may shift during execution.",
        "Requirement ambiguity can lead to schedule drift.",
        "Planning confidence is moderate given available inputs.",
        "Risk variance is higher with incomplete task context.",
        "Uncertainty around blockers may impact completion timing.",
    ],
}

SUGGESTION_POOLS = {
    "immediate_actions": [
        "Start execution immediately to reduce delay exposure.",
        "Break the task into smaller milestones right away.",
        "Lock the next concrete step and begin now.",
        "Handle the highest-impact subtask first.",
        "Address likely blockers before they escalate.",
        "Create a short execution checkpoint for today.",
        "Convert pending work into actionable mini-tasks.",
        "Set a near-term completion target for momentum.",
        "Resolve dependency questions immediately.",
        "Protect focused work time for this task now.",
    ],
    "planning": [
        "Re-plan the timeline with realistic intermediate checkpoints.",
        "Map dependencies before proceeding further.",
        "Define a phased plan with daily deliverables.",
        "Add a short contingency buffer to the schedule.",
        "Sequence work by risk and uncertainty first.",
        "Re-estimate effort using latest task context.",
        "Align scope with available delivery capacity.",
        "Create a checkpoint-based execution roadmap.",
        "Clarify acceptance criteria before implementation continues.",
        "Prioritize must-have outcomes in the current cycle.",
    ],
    "resource_management": [
        "Reallocate additional support if available.",
        "Pair with another contributor for critical sections.",
        "Shift low-impact work away from this timeline.",
        "Escalate resource needs early to avoid bottlenecks.",
        "Balance team bandwidth around this deliverable.",
        "Assign ownership for each major subtask.",
        "Use backup support for high-risk dependencies.",
        "Reduce parallel commitments on key contributors.",
        "Increase review capacity for faster turnaround.",
        "Reserve dedicated time blocks for this task.",
    ],
    "risk_mitigation": [
        "Review dependencies and pre-empt likely blockers.",
        "Add early validation checkpoints to reduce rework.",
        "Perform a quick risk review before execution.",
        "Track progress against a strict daily threshold.",
        "Introduce contingency actions for critical failure points.",
        "Validate assumptions early with small experiments.",
        "Increase visibility with short status updates.",
        "Use phased delivery to contain uncertainty.",
        "Address ambiguous requirements before implementation expands.",
        "Define rollback-safe steps for risky changes.",
    ],
    "productivity": [
        "Batch similar work to reduce context switching.",
        "Timebox implementation segments for better focus.",
        "Use a short priority list for the next execution window.",
        "Minimize interruptions during core development time.",
        "Close small pending items to regain momentum.",
        "Set measurable micro-goals for each work session.",
        "Reduce non-essential scope for faster delivery.",
        "Capture blockers immediately when they appear.",
        "Review progress at fixed intervals each day.",
        "Keep task updates concise and outcome-driven.",
    ],
    "communication": [
        "Share timeline risks early with stakeholders.",
        "Confirm dependency owners and expected dates.",
        "Escalate blockers quickly when impact is high.",
        "Align expectations with the team on delivery risk.",
        "Request timely feedback for pending decisions.",
        "Publish concise progress updates to maintain visibility.",
        "Clarify priority trade-offs with project owners.",
        "Communicate scope changes before implementation diverges.",
        "Document decision points to reduce confusion.",
        "Coordinate handoffs proactively across contributors.",
    ],
}


def parse_due_date(due_raw):
    if not due_raw:
        return None
    try:
        value = str(due_raw).replace("Z", "+00:00")
        due = datetime.fromisoformat(value)
        if due.tzinfo is None:
            due = due.replace(tzinfo=timezone.utc)
        return due.astimezone(timezone.utc)
    except Exception:
        return None


def transform_input(task):
    now = datetime.now(timezone.utc)
    due = parse_due_date(task.get("dueDate"))
    if due:
        time_left = (due - now).total_seconds() / (24 * 60 * 60)
    else:
        # Missing dueDate handling
        time_left = 0.0

    # Missing priority handling defaults to "medium"
    priority_encoded = priority_map.get(str(task.get("priority") or "medium").lower(), 1)
    return float(time_left), float(priority_encoded)


def _sample_category(pool, category, rng):
    options = pool.get(category, [])
    if not options:
        return []
    count = 1 if len(options) == 1 else rng.randint(1, 2)
    count = min(count, len(options))
    return rng.sample(options, count)


def _dedup_preserve_order(items):
    seen = set()
    result = []
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result


def generate_insights(time_left, priority, risk):
    seed_value = hash(str(time_left) + str(priority))
    rng = random.Random()
    rng.seed(seed_value)

    reason_categories = ["workload_behavior", "uncertainty/context"]
    suggestion_categories = ["risk_mitigation"]

    if time_left < 0:
        reason_categories.extend(["overdue", "risk_pattern"])
    elif 0 <= time_left < 3:
        reason_categories.append("time_urgency")
        suggestion_categories.append("immediate_actions")
    elif 3 <= time_left < 7:
        reason_categories.append("risk_pattern")
        suggestion_categories.append("planning")

    if priority == "high":
        reason_categories.append("priority_impact")
        suggestion_categories.append("resource_management")

    suggestion_categories.append(rng.choice(["productivity", "communication"]))

    reason_categories = _dedup_preserve_order(reason_categories)
    suggestion_categories = _dedup_preserve_order(suggestion_categories)

    reasons = []
    suggestions = []

    for cat in reason_categories:
        reasons.extend(_sample_category(REASON_POOLS, cat, rng))
    for cat in suggestion_categories:
        suggestions.extend(_sample_category(SUGGESTION_POOLS, cat, rng))

    reasons = _dedup_preserve_order(reasons)
    suggestions = _dedup_preserve_order(suggestions)

    rng.shuffle(reasons)
    rng.shuffle(suggestions)

    return {
        "delay_risk": risk,
        "reasons": reasons[:5],
        "suggestions": suggestions[:6],
    }


def predict(task):
    time_left, priority_encoded = transform_input(task)
    features = {"time_left": time_left, "priority_encoded": priority_encoded}
    logger.info("Extracted features: %s", features)

    prob = float(model.predict_proba([[time_left, priority_encoded]])[0][1])
    logger.info("Model probability (delay class): %.4f", prob)

    risk_before_adjustment = prob * 100
    risk = risk_before_adjustment

    if 0 <= time_left <= 3:
        logger.info("Schedule adjustment: 0 <= time_left <= 3 → +30")
        risk += 30
    elif 3 < time_left <= 7:
        logger.info("Schedule adjustment: 3 < time_left <= 7 → +15")
        risk += 15

    risk = min(risk, 100)

    # Status is applied only after model output + schedule window adjustments (model unchanged).
    status = normalize_status(task.get("status"))
    risk_before_status = risk
    if status == "in progress":
        risk = risk_before_status - 0.3 * risk_before_status
        logger.info(
            "Status adjustment: in progress → risk %.2f → %.2f",
            risk_before_status,
            risk,
        )
    elif status == "done":
        risk = 0
        logger.info("Status adjustment: done → risk set to 0")

    risk = max(0.0, min(float(risk), 100.0))
    logger.info("Final delay_risk (%%): %.2f", risk)

    if status == "done":
        return {
            "delay_risk": risk,
            "reasons": ["Task completed successfully"],
            "suggestions": [],
        }

    priority = str(task.get("priority") or "medium").lower()
    return generate_insights(time_left, priority, risk)


@app.before_request
def log_incoming_request():
    """Log every HTTP request as it arrives (including CORS OPTIONS preflight)."""
    logger.info("→ %s %s", request.method, request.path)


@app.route("/predict", methods=["POST"])
def predict_api():
    """
    Expects JSON: dueDate (ISO or null), priority (low|medium|high), status (todo|in progress|done).
    Variants like inprogress / In Progress are normalized. Model inputs use only dueDate + priority.
    """
    data = request.get_json(silent=True)
    logger.info("POST /predict request body: %s", data)

    if not data:
        logger.warning("POST /predict rejected: empty body")
        return jsonify({"error": "No data received"}), 400

    task = {
        "dueDate": data.get("dueDate"),
        "priority": data.get("priority"),
        "status": data.get("status"),
    }
    result = predict(task)
    logger.info(
        "POST /predict response: delay_risk=%.2f, reasons=%d, suggestions=%d",
        result.get("delay_risk", 0),
        len(result.get("reasons") or []),
        len(result.get("suggestions") or []),
    )
    return jsonify(result)


@app.route("/")
def home():
    return "ML API is running"


if __name__ == "__main__":
    logger.info("Starting Flask dev server on http://127.0.0.1:5000")
    app.run(port=5000)
