import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ContactBookApp());
}

// ─── MODEL ───────────────────────────────────────────────────────────────────

class Contact {
  final String id;
  String name;
  String phone;
  String? imagePath;
  bool isFavorite;

  Contact({
    required this.id,
    required this.name,
    required this.phone,
    this.imagePath,
    this.isFavorite = false,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'phone': phone,
        'imagePath': imagePath,
        'isFavorite': isFavorite,
      };

  factory Contact.fromMap(Map<String, dynamic> map) => Contact(
        id: map['id'],
        name: map['name'],
        phone: map['phone'],
        imagePath: map['imagePath'],
        isFavorite: map['isFavorite'] ?? false,
      );
}

// ─── THEME & COLORS ──────────────────────────────────────────────────────────

class AppColors {
  // Softer, muted pastel tones (matte)
  static const Color pink = Color(0xFFE8A5A8);
  static const Color peach = Color(0xFFF0D5CA);
  static const Color lavender = Color(0xFFE4C5E0);
  static const Color lightBg = Color(0xFFF9F7F8);
  static const Color darkBg = Color(0xFF1E1E2F);
  static const Color darkCard = Color(0xFF2A2A3E);
  static const Color textPrimary = Color(0xFF2D3142);
  static const Color textSecondary = Color(0xFF8D909B);

  // Matte gradients (lower contrast)
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [pink, peach, lavender],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient splashGradient = LinearGradient(
    colors: [Color(0xFFEBB0B3), Color(0xFFF2D8CE), Color(0xFFE8CAE4)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

// ─── APP ROOT ────────────────────────────────────────────────────────────────

class ContactBookApp extends StatefulWidget {
  const ContactBookApp({super.key});

  @override
  State<ContactBookApp> createState() => _ContactBookAppState();
}

class _ContactBookAppState extends State<ContactBookApp> {
  bool _isDarkMode = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  void _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() => _isDarkMode = prefs.getBool('isDarkMode') ?? false);
  }

  void _toggleTheme() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() => _isDarkMode = !_isDarkMode);
    await prefs.setBool('isDarkMode', _isDarkMode);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Contact Book',
      debugShowCheckedModeBanner: false,
      themeMode: _isDarkMode ? ThemeMode.dark : ThemeMode.light,
      theme: _buildTheme(false),
      darkTheme: _buildTheme(true),
      home: SplashScreen(isDarkMode: _isDarkMode, onToggleTheme: _toggleTheme),
    );
  }

  ThemeData _buildTheme(bool isDark) {
    final base = isDark ? ThemeData.dark() : ThemeData.light();
    return base.copyWith(
      useMaterial3: true,
      scaffoldBackgroundColor: isDark ? AppColors.darkBg : AppColors.lightBg,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.pink,
        brightness: isDark ? Brightness.dark : Brightness.light,
      ),
      textTheme: const TextTheme(
        headlineMedium: TextStyle(fontWeight: FontWeight.w700, fontSize: 26, color: AppColors.textPrimary),
        titleLarge: TextStyle(fontWeight: FontWeight.w600, fontSize: 20, color: AppColors.textPrimary),
        bodyMedium: TextStyle(color: AppColors.textSecondary, fontSize: 15),
      ),
    );
  }
}

// ─── SPLASH SCREEN ───────────────────────────────────────────────────────────

class SplashScreen extends StatefulWidget {
  final bool isDarkMode;
  final VoidCallback onToggleTheme;

  const SplashScreen({super.key, required this.isDarkMode, required this.onToggleTheme});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _slide;
  late Animation<double> _scale;
  late Animation<double> _fadeText;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2800),
    );

    _slide = Tween<Offset>(
      begin: const Offset(-1.5, 0),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.0, 0.6, curve: Curves.easeOut),
    ));

    _scale = Tween<double>(begin: 0.9, end: 1.0).animate(CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.3, 0.7, curve: Curves.elasticOut),
    ));

    _fadeText = Tween<double>(begin: 0.0, end: 1.0).animate(CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.65, 1.0, curve: Curves.easeIn),
    ));

    _controller.forward();

    Future.delayed(const Duration(milliseconds: 3200), () {
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        PageRouteBuilder(
          transitionDuration: const Duration(milliseconds: 600),
          pageBuilder: (_, __, ___) => MainScreen(
            isDarkMode: widget.isDarkMode,
            onToggleTheme: widget.onToggleTheme,
          ),
          transitionsBuilder: (_, anim, __, child) => FadeTransition(opacity: anim, child: child),
        ),
      );
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppColors.splashGradient,
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Soft glow behind character
            Positioned(
              bottom: 220,
              child: Container(
                height: 220,
                width: 220,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.12),
                ),
              ),
            ),

            // Animated Image
            SlideTransition(
              position: _slide,
              child: ScaleTransition(
                scale: _scale,
                child: Image.network(
                  "https://drive.google.com/uc?export=view&id=1UQu00xxlPzxZQhzcLzPiiDjS3ME1xDOI",
                  height: 280,
                  fit: BoxFit.contain,
                  loadingBuilder: (context, child, progress) {
                    if (progress == null) return child;
                    return const Center(child: CircularProgressIndicator(color: Colors.white70));
                  },
                  errorBuilder: (context, error, stackTrace) => const Icon(Icons.error_outline, color: Colors.white54, size: 50),
                ),
              ),
            ),

            // Text
            Positioned(
              bottom: 120,
              child: FadeTransition(
                opacity: _fadeText,
                child: const Text(
                  "Contact Book",
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                    letterSpacing: 1.5,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── MAIN SCREEN (HOME) ──────────────────────────────────────────────────────

class MainScreen extends StatefulWidget {
  final bool isDarkMode;
  final VoidCallback onToggleTheme;

  const MainScreen({super.key, required this.isDarkMode, required this.onToggleTheme});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> with SingleTickerProviderStateMixin {
  List<Contact> _allContacts = [];
  String _searchQuery = "";
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadContacts();
  }

  Future<void> _loadContacts() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString('contacts_data');
    if (data != null) {
      final List decoded = jsonDecode(data);
      setState(() {
        _allContacts = decoded.map((m) => Contact.fromMap(m)).toList();
      });
    }
  }

  Future<void> _saveContacts() async {
    final prefs = await SharedPreferences.getInstance();
    final data = jsonEncode(_allContacts.map((c) => c.toMap()).toList());
    await prefs.setString('contacts_data', data);
  }

  void _addOrUpdate(Contact contact) {
    setState(() {
      final index = _allContacts.indexWhere((c) => c.id == contact.id);
      if (index != -1) {
        _allContacts[index] = contact;
      } else {
        _allContacts.insert(0, contact);
      }
    });
    _saveContacts();
  }

  void _delete(String id) {
    setState(() => _allContacts.removeWhere((c) => c.id == id));
    _saveContacts();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Contact removed'), behavior: SnackBarBehavior.floating),
    );
  }

  void _toggleFav(String id) {
    setState(() {
      final c = _allContacts.firstWhere((e) => e.id == id);
      c.isFavorite = !c.isFavorite;
    });
    _saveContacts();
  }

  List<Contact> _getFiltered(bool favoritesOnly) {
    return _allContacts.where((c) {
      final matchesSearch = c.name.toLowerCase().contains(_searchQuery.toLowerCase()) || 
                           c.phone.contains(_searchQuery);
      return matchesSearch && (!favoritesOnly || c.isFavorite);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background Glows (Low opacity)
          Positioned(
            top: -100,
            right: -100,
            child: _GlowCircle(color: AppColors.pink.withOpacity(0.08), size: 300),
          ),
          Positioned(
            bottom: -50,
            left: -50,
            child: _GlowCircle(color: AppColors.lavender.withOpacity(0.08), size: 250),
          ),
          
          SafeArea(
            child: Column(
              children: [
                _buildAppBar(),
                _buildSearchBar(),
                _buildTabs(),
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildList(false),
                      _buildList(true),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: _buildFAB(),
    );
  }

  Widget _buildAppBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text('Contacts', style: Theme.of(context).textTheme.headlineMedium),
          _GlassIconButton(
            icon: widget.isDarkMode ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
            onPressed: widget.onToggleTheme,
            isDarkMode: widget.isDarkMode,
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        height: 56,
        decoration: Neumorphic.boxDecoration(widget.isDarkMode, radius: 20),
        child: TextField(
          onChanged: (v) => setState(() => _searchQuery = v),
          style: const TextStyle(fontSize: 16),
          decoration: const InputDecoration(
            hintText: 'Search by name or number...',
            prefixIcon: Icon(Icons.search_rounded, color: AppColors.textSecondary),
            border: InputBorder.none,
            contentPadding: EdgeInsets.symmetric(vertical: 18),
          ),
        ),
      ),
    );
  }

  Widget _buildTabs() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Container(
        height: 50,
        decoration: Neumorphic.boxDecoration(widget.isDarkMode, radius: 25),
        child: TabBar(
          controller: _tabController,
          dividerColor: Colors.transparent,
          indicator: BoxDecoration(
            borderRadius: BorderRadius.circular(25),
            gradient: AppColors.primaryGradient,
          ),
          indicatorSize: TabBarIndicatorSize.tab,
          labelColor: Colors.white,
          unselectedLabelColor: AppColors.textSecondary,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold),
          tabs: const [Tab(text: 'All'), Tab(text: 'Favorites')],
        ),
      ),
    );
  }

  Widget _buildList(bool favsOnly) {
    final list = _getFiltered(favsOnly);
    if (list.isEmpty) return _buildEmptyState(favsOnly);
    
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      itemCount: list.length,
      itemBuilder: (context, i) => ContactCard(
        contact: list[i],
        isDarkMode: widget.isDarkMode,
        onTap: () => _openDetail(list[i]),
        onDelete: () => _confirmDelete(list[i].id),
        onFav: () => _toggleFav(list[i].id),
      ),
    );
  }

  Widget _buildEmptyState(bool favsOnly) {
    return Center(
      child: Opacity(
        opacity: 0.5,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(favsOnly ? Icons.favorite_border_rounded : Icons.person_search_rounded, size: 80),
            const SizedBox(height: 16),
            Text(favsOnly ? 'No favorite contacts yet' : 'No contacts found', style: const TextStyle(fontSize: 18)),
          ],
        ),
      ),
    );
  }

  Widget _buildFAB() {
    return Container(
      width: 65,
      height: 65,
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: AppColors.pink.withOpacity(0.15),
            blurRadius: 15,
            offset: const Offset(0, 8),
          )
        ],
      ),
      child: RawMaterialButton(
        onPressed: () => _openUpsert(),
        shape: const CircleBorder(),
        child: const Icon(Icons.add_rounded, color: Colors.white, size: 32),
      ),
    );
  }

  void _openDetail(Contact contact) {
    Navigator.push(
      context,
      PageRouteBuilder(
        pageBuilder: (context, anim, secondaryAnim) => DetailScreen(
          contact: contact,
          onEdit: () => _openUpsert(contact: contact),
          onDelete: () {
            Navigator.pop(context);
            _confirmDelete(contact.id);
          },
        ),
        transitionsBuilder: (context, anim, secondaryAnim, child) {
          return FadeTransition(opacity: anim, child: child);
        },
      ),
    );
  }

  void _openUpsert({Contact? contact}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => UpsertSheet(
        contact: contact,
        isDarkMode: widget.isDarkMode,
        onSave: _addOrUpdate,
      ),
    );
  }

  void _confirmDelete(String id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Contact?'),
        content: const Text('This will permanently remove this contact.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _delete(id);
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}

// ─── DETAIL SCREEN ───────────────────────────────────────────────────────────

class DetailScreen extends StatelessWidget {
  final Contact contact;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const DetailScreen({super.key, required this.contact, required this.onEdit, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 350,
            pinned: true,
            backgroundColor: isDark ? AppColors.darkBg : AppColors.lightBg,
            leading: _GlassIconButton(
              icon: Icons.arrow_back_ios_new_rounded, 
              onPressed: () => Navigator.pop(context), 
              isDarkMode: isDark,
              margin: const EdgeInsets.all(8),
            ),
            actions: [
              _GlassIconButton(
                icon: Icons.edit_rounded, 
                onPressed: onEdit, 
                isDarkMode: isDark,
                margin: const EdgeInsets.all(8),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Hero(
                tag: 'avatar-${contact.id}',
                child: Container(
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    image: contact.imagePath != null 
                      ? DecorationImage(image: FileImage(File(contact.imagePath!)), fit: BoxFit.cover)
                      : null,
                  ),
                  child: contact.imagePath == null 
                    ? Center(child: Text(contact.name[0].toUpperCase(), style: const TextStyle(fontSize: 100, color: Colors.white, fontWeight: FontWeight.bold)))
                    : null,
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                children: [
                  Text(contact.name, style: Theme.of(context).textTheme.headlineMedium),
                  const SizedBox(height: 8),
                  Text(contact.phone, style: const TextStyle(fontSize: 18, color: AppColors.textSecondary)),
                  const SizedBox(height: 48),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _DetailAction(icon: Icons.call_rounded, label: 'Call', color: Colors.green),
                      _DetailAction(icon: Icons.message_rounded, label: 'SMS', color: Colors.blue),
                      _DetailAction(icon: Icons.videocam_rounded, label: 'Video', color: Colors.purple),
                    ],
                  ),
                  const SizedBox(height: 48),
                  _GlassTile(
                    icon: Icons.location_on_rounded, 
                    title: 'Location', 
                    subtitle: 'No address provided', 
                    isDarkMode: isDark
                  ),
                  const SizedBox(height: 16),
                  _GlassTile(
                    icon: Icons.email_rounded, 
                    title: 'Email', 
                    subtitle: 'No email provided', 
                    isDarkMode: isDark
                  ),
                  const SizedBox(height: 64),
                  TextButton.icon(
                    onPressed: onDelete, 
                    icon: const Icon(Icons.delete_outline_rounded, color: Colors.red),
                    label: const Text('Delete Contact', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}

// ─── UPSERT SHEET (ADD/EDIT) ─────────────────────────────────────────────────

class UpsertSheet extends StatefulWidget {
  final Contact? contact;
  final bool isDarkMode;
  final Function(Contact) onSave;

  const UpsertSheet({super.key, this.contact, required this.isDarkMode, required this.onSave});

  @override
  State<UpsertSheet> createState() => _UpsertSheetState();
}

class _UpsertSheetState extends State<UpsertSheet> {
  late TextEditingController _nameCtrl;
  late TextEditingController _phoneCtrl;
  String? _imagePath;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.contact?.name ?? "");
    _phoneCtrl = TextEditingController(text: widget.contact?.phone ?? "");
    _imagePath = widget.contact?.imagePath;
  }

  Future<void> _pickImage() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery);
    if (picked != null) setState(() => _imagePath = picked.path);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      decoration: BoxDecoration(
        color: widget.isDarkMode ? AppColors.darkCard : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withOpacity(0.2), borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 24),
            Text(widget.contact == null ? 'New Contact' : 'Edit Contact', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 32),
            GestureDetector(
              onTap: _pickImage,
              child: Stack(
                children: [
                  Container(
                    width: 120, height: 120,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: AppColors.primaryGradient,
                      boxShadow: [BoxShadow(color: AppColors.pink.withOpacity(0.12), blurRadius: 15, offset: const Offset(0, 6))],
                    ),
                    padding: const EdgeInsets.all(4),
                    child: CircleAvatar(
                      backgroundColor: widget.isDarkMode ? AppColors.darkBg : Colors.white,
                      backgroundImage: _imagePath != null ? FileImage(File(_imagePath!)) : null,
                      child: _imagePath == null ? const Icon(Icons.camera_alt_rounded, size: 40, color: AppColors.peach) : null,
                    ),
                  ),
                  Positioned(bottom: 0, right: 0, child: _GlowCircle(color: Colors.white, size: 36, child: const Icon(Icons.add_rounded, size: 20, color: AppColors.pink))),
                ],
              ),
            ),
            const SizedBox(height: 32),
            _StyledInput(label: 'Full Name', controller: _nameCtrl, icon: Icons.person_rounded, isDarkMode: widget.isDarkMode),
            const SizedBox(height: 24),
            _StyledInput(label: 'Phone Number', controller: _phoneCtrl, icon: Icons.phone_rounded, isDarkMode: widget.isDarkMode, kbType: TextInputType.phone),
            const SizedBox(height: 48),
            Container(
              width: double.infinity, height: 60,
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [BoxShadow(color: AppColors.pink.withOpacity(0.15), blurRadius: 12, offset: const Offset(0, 6))],
              ),
              child: ElevatedButton(
                onPressed: () {
                  if (_nameCtrl.text.trim().isEmpty) return;
                  widget.onSave(Contact(
                    id: widget.contact?.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
                    name: _nameCtrl.text,
                    phone: _phoneCtrl.text,
                    imagePath: _imagePath,
                    isFavorite: widget.contact?.isFavorite ?? false,
                  ));
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                child: const Text('Save Contact', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── UI COMPONENTS ───────────────────────────────────────────────────────────

class ContactCard extends StatelessWidget {
  final Contact contact;
  final bool isDarkMode;
  final VoidCallback onTap;
  final VoidCallback onDelete;
  final VoidCallback onFav;

  const ContactCard({super.key, required this.contact, required this.isDarkMode, required this.onTap, required this.onDelete, required this.onFav});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: Neumorphic.boxDecoration(isDarkMode, radius: 24),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Hero(
                    tag: 'avatar-${contact.id}',
                    child: Container(
                      width: 60, height: 60,
                      decoration: const BoxDecoration(shape: BoxShape.circle, gradient: AppColors.primaryGradient),
                      padding: const EdgeInsets.all(2),
                      child: CircleAvatar(
                        backgroundColor: isDarkMode ? AppColors.darkCard : Colors.white,
                        backgroundImage: contact.imagePath != null ? FileImage(File(contact.imagePath!)) : null,
                        child: contact.imagePath == null ? Text(contact.name[0].toUpperCase(), style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.pink)) : null,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(contact.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17, color: AppColors.textPrimary)),
                        const SizedBox(height: 4),
                        Text(contact.phone, style: const TextStyle(color: AppColors.textSecondary, fontSize: 14)),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Icon(contact.isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded, color: contact.isFavorite ? Colors.red.withOpacity(0.7) : AppColors.textSecondary),
                    onPressed: onFav,
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline_rounded, color: AppColors.textSecondary),
                    onPressed: onDelete,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _StyledInput extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final IconData icon;
  final bool isDarkMode;
  final TextInputType kbType;

  const _StyledInput({required this.label, required this.controller, required this.icon, required this.isDarkMode, this.kbType = TextInputType.text});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.pink)),
        const SizedBox(height: 8),
        Container(
          decoration: Neumorphic.boxDecoration(isDarkMode, radius: 15),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: TextField(
            controller: controller,
            keyboardType: kbType,
            style: TextStyle(color: isDarkMode ? Colors.white : AppColors.textPrimary),
            decoration: InputDecoration(
              icon: Icon(icon, color: AppColors.textSecondary),
              border: InputBorder.none,
              hintText: 'Enter $label',
              hintStyle: TextStyle(color: AppColors.textSecondary.withOpacity(0.6)),
            ),
          ),
        ),
      ],
    );
  }
}

class _GlassIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onPressed;
  final bool isDarkMode;
  final EdgeInsets? margin;

  const _GlassIconButton({required this.icon, required this.onPressed, required this.isDarkMode, this.margin});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      decoration: Neumorphic.boxDecoration(isDarkMode, radius: 12),
      child: IconButton(icon: Icon(icon, color: isDarkMode ? Colors.white : AppColors.textPrimary), onPressed: onPressed),
    );
  }
}

class _GlassTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool isDarkMode;

  const _GlassTile({required this.icon, required this.title, required this.subtitle, required this.isDarkMode});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: Neumorphic.boxDecoration(isDarkMode, radius: 20),
      child: Row(
        children: [
          _GlowCircle(color: AppColors.pink.withOpacity(0.08), size: 48, child: Icon(icon, color: AppColors.pink)),
          const SizedBox(width: 16),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary)),
            Text(subtitle, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          ]),
        ],
      ),
    );
  }
}

class _DetailAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _DetailAction({required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 56, height: 56,
          decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
          child: Icon(icon, color: color, size: 28),
        ),
        const SizedBox(height: 8),
        Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 13)),
      ],
    );
  }
}

class _GlowCircle extends StatelessWidget {
  final Color color;
  final double size;
  final Widget? child;

  const _GlowCircle({required this.color, required this.size, this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle, boxShadow: [BoxShadow(color: color.withOpacity(0.3), blurRadius: size/2)]),
      alignment: Alignment.center,
      child: child,
    );
  }
}

class Neumorphic {
  static BoxDecoration boxDecoration(bool isDark, {double radius = 20}) {
    return BoxDecoration(
      color: isDark ? AppColors.darkCard : Colors.white,
      borderRadius: BorderRadius.circular(radius),
      boxShadow: isDark 
        ? [
            BoxShadow(color: Colors.black.withOpacity(0.3), offset: const Offset(4, 4), blurRadius: 10),
            BoxShadow(color: Colors.white.withOpacity(0.03), offset: const Offset(-4, -4), blurRadius: 10),
          ]
        : [
            BoxShadow(color: Colors.black.withOpacity(0.04), offset: const Offset(8, 8), blurRadius: 15),
            BoxShadow(color: Colors.white.withOpacity(0.8), offset: const Offset(-8, -8), blurRadius: 15),
          ],
    );
  }
}
