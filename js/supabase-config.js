/**
 * CHOLAN HOLIDAYS - Supabase Client Configuration & Data Services
 */

const SUPABASE_URL = 'https://uxuonkpxvlxyuiugixew.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4dW9ua3B4dmx4eXVpdWdpeGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NTI5NjIsImV4cCI6MjEwMzEyODk2Mn0.vo_c1jd1rGR2v-BTaaDYDJPkTf2fyTddtveuzFipepE';

// Initialize Supabase Client
let supabaseClient = null;
if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const CholanAPI = {
  getClient() {
    if (!supabaseClient && window.supabase) {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabaseClient;
  },

  // 1. Site Settings
  async getSiteSettings() {
    const client = this.getClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('site_settings')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Using fallback settings:', err.message);
      return null;
    }
  },

  // 2. Hero Banners
  async getHeroBanners() {
    const client = this.getClient();
    if (!client) return [];
    try {
      const { data, error } = await client
        .from('hero_banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Using fallback hero banners:', err.message);
      return [];
    }
  },

  // 3. Destinations
  async getDestinations(featuredOnly = false) {
    const client = this.getClient();
    if (!client) return [];
    try {
      let query = client
        .from('destinations')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      
      if (featuredOnly) {
        query = query.eq('is_featured', true).limit(4);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Using fallback destinations:', err.message);
      return [];
    }
  },

  // 3.1 Single Destination by Slug
  async getDestinationBySlug(slug) {
    const client = this.getClient();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('destinations')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Error fetching destination slug:', slug, err.message);
      return null;
    }
  },

  // 4. Tour Packages
  async getTourPackages(category = 'all', limit = null) {
    const client = this.getClient();
    if (!client) return [];
    try {
      let query = client
        .from('tour_packages')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (category && category !== 'all') {
        query = query.ilike('category', `%${category}%`);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Using fallback tour packages:', err.message);
      return [];
    }
  },

  // 5. Gallery Items
  async getGalleryItems() {
    const client = this.getClient();
    if (!client) return [];
    try {
      const { data, error } = await client
        .from('gallery_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Using fallback gallery items:', err.message);
      return [];
    }
  },

  // 6. Blogs
  async getBlogs(limit = null) {
    const client = this.getClient();
    if (!client) return [];
    try {
      let query = client
        .from('blogs')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Using fallback blogs:', err.message);
      return [];
    }
  },

  // 7. Submit Quick Enquiry
  async submitEnquiry(enquiryData) {
    const client = this.getClient();
    if (!client) throw new Error('Database client not initialized');

    const { data, error } = await client
      .from('enquiries')
      .insert([
        {
          name: enquiryData.name,
          email: enquiryData.email,
          phone: enquiryData.phone,
          package_name: enquiryData.packageName || 'General Enquiry',
          message: enquiryData.message || '',
          status: 'pending'
        }
      ])
      .select();

    if (error) throw error;
    return data;
  },

  // 8. Submit Contact Message
  async submitContactMessage(contactData) {
    const client = this.getClient();
    if (!client) throw new Error('Database client not initialized');

    const { data, error } = await client
      .from('contact_messages')
      .insert([
        {
          name: contactData.name,
          email: contactData.email,
          phone: contactData.phone,
          package_interest: contactData.packageInterest || '',
          message: contactData.message,
          status: 'unread'
        }
      ])
      .select();

    if (error) throw error;
    return data;
  },

  // 9. Storage Upload Helper
  async uploadMedia(file, folder = 'uploads') {
    const client = this.getClient();
    if (!client) throw new Error('Database client not initialized');

    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const { data, error } = await client.storage
      .from('site-media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: publicUrlData } = client.storage
      .from('site-media')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  },

  // 10. Admin Authentication Services
  async loginAdmin(email, password) {
    const client = this.getClient();
    if (!client) throw new Error('Database client not initialized');

    const { data, error } = await client.rpc('authenticate_admin', {
      p_email: email,
      p_password: password
    });

    if (error) throw error;
    if (data && data.success) {
      localStorage.setItem('cholan_admin_session', JSON.stringify({
        token: data.token,
        admin: data.admin,
        timestamp: Date.now()
      }));
    }
    return data;
  },

  async changeAdminPassword(email, currentPassword, newPassword) {
    const client = this.getClient();
    if (!client) throw new Error('Database client not initialized');

    const { data, error } = await client.rpc('change_admin_password', {
      p_email: email,
      p_current_password: currentPassword,
      p_new_password: newPassword
    });

    if (error) throw error;
    return data;
  },

  getAdminSession() {
    try {
      const saved = localStorage.getItem('cholan_admin_session');
      if (!saved) return null;
      const session = JSON.parse(saved);
      // Session expires after 7 days
      if (Date.now() - session.timestamp > 7 * 24 * 60 * 60 * 1000) {
        this.logoutAdmin();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  logoutAdmin() {
    localStorage.removeItem('cholan_admin_session');
    sessionStorage.removeItem('cholan_admin_session');
  }
};

window.CholanAPI = CholanAPI;
