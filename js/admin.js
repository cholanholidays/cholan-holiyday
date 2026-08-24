/**
 * CHOLAN HOLIDAYS - Admin Dashboard Management Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  const client = window.CholanAPI ? window.CholanAPI.getClient() : null;
  if (!client) {
    console.error('Supabase client failed to load in Admin.');
    return;
  }

  const authSection = document.getElementById('adminAuthSection');
  const dashboardSection = document.getElementById('adminDashboardSection');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const loginFeedback = document.getElementById('loginFeedback');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  const tabButtons = document.querySelectorAll('.admin-tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Modal elements
  const crudModal = document.getElementById('adminCrudModal');
  const adminModalTitle = document.getElementById('adminModalTitle');
  const adminModalBody = document.getElementById('adminModalBody');
  const closeAdminModalBtn = document.getElementById('closeAdminModalBtn');

  function openModal(title, contentHtml) {
    adminModalTitle.textContent = title;
    adminModalBody.innerHTML = contentHtml;
    crudModal.classList.add('active');
  }

  function closeModal() {
    crudModal.classList.remove('active');
  }

  if (closeAdminModalBtn) closeAdminModalBtn.addEventListener('click', closeModal);
  if (crudModal) {
    crudModal.addEventListener('click', (e) => {
      if (e.target === crudModal) closeModal();
    });
  }

  // Mobile Sidebar Toggle
  const adminSidebar = document.getElementById('adminSidebar');
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const activePageTitle = document.getElementById('activePageTitle');

  function toggleSidebar() {
    if (adminSidebar) adminSidebar.classList.toggle('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.toggle('open');
  }

  function closeSidebar() {
    if (adminSidebar) adminSidebar.classList.remove('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('open');
  }

  if (sidebarToggleBtn) sidebarToggleBtn.onclick = toggleSidebar;
  if (sidebarBackdrop) sidebarBackdrop.onclick = closeSidebar;

  // Tab switching
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const target = document.getElementById(targetId);
      if (target) target.classList.add('active');

      const title = btn.getAttribute('data-title') || btn.innerText.trim();
      if (activePageTitle) activePageTitle.textContent = title;

      closeSidebar();
    });
  });

  // Load All Admin Data
  async function loadAllAdminData() {
    loadDashboardStats();
    loadEnquiries();
    loadMessages();
    loadPackages();
    loadDestinations();
    loadGallery();
    loadBlogs();
    loadBanners();
    loadSettings();
  }

  // 1. Dashboard Stats
  async function loadDashboardStats() {
    const { count: enqCount } = await client.from('enquiries').select('*', { count: 'exact', head: true });
    const { count: msgCount } = await client.from('contact_messages').select('*', { count: 'exact', head: true });
    const { count: pkgCount } = await client.from('tour_packages').select('*', { count: 'exact', head: true });
    const { count: destCount } = await client.from('destinations').select('*', { count: 'exact', head: true });

    document.getElementById('statEnquiriesCount').textContent = enqCount || 0;
    document.getElementById('statMessagesCount').textContent = msgCount || 0;
    document.getElementById('statPackagesCount').textContent = pkgCount || 0;
    document.getElementById('statDestinationsCount').textContent = destCount || 0;
  }

  // 2. Enquiries
  async function loadEnquiries() {
    const { data, error } = await client
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });

    const recentTbody = document.getElementById('recentEnquiriesTable');
    const allTbody = document.getElementById('allEnquiriesTable');

    if (error || !data || !data.length) {
      const emptyRow = '<tr><td colspan=\"7\" style=\"text-align: center; color: #a89f91;\">No enquiries received yet.</td></tr>';
      if (recentTbody) recentTbody.innerHTML = '<tr><td colspan=\"5\" style=\"text-align:center;\">No recent enquiries.</td></tr>';
      if (allTbody) allTbody.innerHTML = emptyRow;
      return;
    }

      // Recent 5
      if (recentTbody) {
        recentTbody.innerHTML = data.slice(0, 5).map(e => `
          <tr>
            <td>${new Date(e.created_at).toLocaleDateString()}</td>
            <td><strong>${e.name}</strong></td>
            <td>${e.phone}</td>
            <td><span style="color:#c6923c;">${e.package_name || 'General'}</span></td>
            <td><span class="status-badge status-${e.status}">${e.status}</span></td>
          </tr>
        `).join('');
      }

      // All
      if (allTbody) {
        allTbody.innerHTML = data.map(e => `
          <tr>
            <td>${new Date(e.created_at).toLocaleDateString()}<br><small style="color:#8c8376;">${new Date(e.created_at).toLocaleTimeString()}</small></td>
            <td><strong>${e.name}</strong></td>
            <td><i class="fa-solid fa-envelope"></i> ${e.email}<br><i class="fa-solid fa-phone"></i> ${e.phone}</td>
            <td><span style="color:#c6923c; font-weight:600;">${e.package_name}</span></td>
            <td style="max-width: 250px;">${e.message || '<em style="color:#888;">None</em>'}</td>
            <td>
              <select class="admin-input enq-status-select" data-id="${e.id}" style="padding: 4px 8px; font-size: 0.8rem;">
                <option value="pending" ${e.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="contacted" ${e.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                <option value="confirmed" ${e.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                <option value="cancelled" ${e.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </td>
            <td>
              <button class="btn-action btn-del delete-enquiry-btn" data-id="${e.id}"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        `).join('');

      document.querySelectorAll('.enq-status-select').forEach(sel => {
        sel.addEventListener('change', async (ev) => {
          const id = ev.target.getAttribute('data-id');
          await client.from('enquiries').update({ status: ev.target.value }).eq('id', id);
          loadEnquiries();
          loadDashboardStats();
        });
      });

      document.querySelectorAll('.delete-enquiry-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Are you sure you want to delete this enquiry?')) {
            const id = btn.getAttribute('data-id');
            await client.from('enquiries').delete().eq('id', id);
            loadEnquiries();
            loadDashboardStats();
          }
        });
      });
    }
  }

  document.getElementById('refreshEnquiriesBtn')?.addEventListener('click', loadEnquiries);

  // 3. Contact Messages
  async function loadMessages() {
    const { data, error } = await client
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    const allTbody = document.getElementById('allMessagesTable');
    if (!allTbody) return;

    if (error || !data || !data.length) {
      allTbody.innerHTML = '<tr><td colspan=\"7\" style=\"text-align:center;\">No messages received yet.</td></tr>';
      return;
    }

    allTbody.innerHTML = data.map(m => `
      <tr>
        <td>${new Date(m.created_at).toLocaleDateString()}</td>
        <td><strong>${m.name}</strong></td>
        <td>${m.email}<br>${m.phone}</td>
        <td>${m.package_interest || 'General'}</td>
        <td style="max-width: 250px;">${m.message}</td>
        <td>
          <select class="admin-input msg-status-select" data-id="${m.id}" style="padding: 4px 8px; font-size: 0.8rem;">
            <option value="unread" ${m.status === 'unread' ? 'selected' : ''}>Unread</option>
            <option value="read" ${m.status === 'read' ? 'selected' : ''}>Read</option>
            <option value="replied" ${m.status === 'replied' ? 'selected' : ''}>Replied</option>
          </select>
        </td>
        <td>
          <button class="btn-action btn-del delete-msg-btn" data-id="${m.id}"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.msg-status-select').forEach(sel => {
      sel.addEventListener('change', async (ev) => {
        const id = ev.target.getAttribute('data-id');
        await client.from('contact_messages').update({ status: ev.target.value }).eq('id', id);
        loadMessages();
        loadDashboardStats();
      });
    });

    document.querySelectorAll('.delete-msg-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Delete this message?')) {
          const id = btn.getAttribute('data-id');
          await client.from('contact_messages').delete().eq('id', id);
          loadMessages();
          loadDashboardStats();
        }
      });
    });
  }

  document.getElementById('refreshMessagesBtn')?.addEventListener('click', loadMessages);

  // 4. Tour Packages CRUD
  async function loadPackages() {
    const { data, error } = await client.from('tour_packages').select('*').order('created_at', { ascending: true });
    const tbody = document.getElementById('adminPackagesTable');
    if (!tbody) return;

    if (error || !data || !data.length) {
      tbody.innerHTML = '<tr><td colspan=\"7\" style=\"text-align:center;\">No tour packages found.</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(p => `
      <tr>
        <td><img src="${p.image_url}" style="width:60px; height:45px; object-fit:cover; border-radius:4px;"></td>
        <td><strong>${p.title}</strong><br><small style="color:#a89f91;">/${p.slug}</small></td>
        <td><span class="status-badge" style="background:rgba(198,146,60,0.15); color:#c6923c;">${p.category_tag}</span></td>
        <td>${p.duration}</td>
        <td><strong style="color:#e5b35c;">₹${Number(p.price).toLocaleString()}</strong></td>
        <td>
          <input type="checkbox" class="pkg-active-toggle" data-id="${p.id}" ${p.is_active ? 'checked' : ''}>
        </td>
        <td>
          <button class="btn-action btn-edit edit-pkg-btn" data-id="${p.id}"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-action btn-del del-pkg-btn" data-id="${p.id}"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.pkg-active-toggle').forEach(chk => {
      chk.addEventListener('change', async (e) => {
        await client.from('tour_packages').update({ is_active: e.target.checked }).eq('id', e.target.getAttribute('data-id'));
      });
    });

    document.querySelectorAll('.edit-pkg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pkg = data.find(p => p.id === btn.getAttribute('data-id'));
        if (pkg) showPackageModal(pkg);
      });
    });

    document.querySelectorAll('.del-pkg-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this tour package?')) {
          await client.from('tour_packages').delete().eq('id', btn.getAttribute('data-id'));
          loadPackages();
          loadDashboardStats();
        }
      });
    });
  }

  document.getElementById('addNewPackageBtn')?.addEventListener('click', () => {
    showPackageModal(null);
  });

  function showPackageModal(pkg) {
    const isEdit = !!pkg;
    const formHtml = `
      <form id="pkgModalForm">
        <div class="admin-form-grid">
          <div class="admin-form-group">
            <label>Package Title</label>
            <input type="text" id="modalPkgTitle" class="admin-input" value="${pkg ? pkg.title : ''}" required>
          </div>
          <div class="admin-form-group">
            <label>URL Slug</label>
            <input type="text" id="modalPkgSlug" class="admin-input" value="${pkg ? pkg.slug : ''}" required>
          </div>
          <div class="admin-form-group">
            <label>Category (filter key)</label>
            <select id="modalPkgCategory" class="admin-input" required>
              <option value="temple" ${pkg && pkg.category === 'temple' ? 'selected' : ''}>Temple</option>
              <option value="heritage" ${pkg && pkg.category === 'heritage' ? 'selected' : ''}>Heritage</option>
              <option value="family" ${pkg && pkg.category === 'family' ? 'selected' : ''}>Family</option>
              <option value="adventure" ${pkg && pkg.category === 'adventure' ? 'selected' : ''}>Adventure</option>
            </select>
          </div>
          <div class="admin-form-group">
            <label>Category Tag Label</label>
            <input type="text" id="modalPkgTag" class="admin-input" value="${pkg ? pkg.category_tag : 'Temple Tour'}" required>
          </div>
          <div class="admin-form-group">
            <label>Duration</label>
            <input type="text" id="modalPkgDuration" class="admin-input" value="${pkg ? pkg.duration : '3 Nights / 4 Days'}" required>
          </div>
          <div class="admin-form-group">
            <label>Starting Price (₹)</label>
            <input type="number" id="modalPkgPrice" class="admin-input" value="${pkg ? pkg.price : 14999}" required>
          </div>
          <div class="admin-form-group full">
            <label>Image URL or Upload</label>
            <div style="display:flex; gap:10px;">
              <input type="text" id="modalPkgImg" class="admin-input" value="${pkg ? pkg.image_url : ''}" style="flex:1;" required>
              <input type="file" id="modalPkgFile" accept="image/*" style="display:none;">
              <button type="button" class="btn-action btn-edit" id="triggerPkgUpload"><i class="fa-solid fa-upload"></i> Upload</button>
            </div>
          </div>
          <div class="admin-form-group full">
            <label>Description</label>
            <textarea id="modalPkgDesc" class="admin-input" rows="3">${pkg ? (pkg.description || '') : ''}</textarea>
          </div>
        </div>
        <button type="submit" class="btn-primary-sm" style="margin-top:15px; width:100%; justify-content:center;">
          <i class="fa-solid fa-floppy-disk"></i> ${isEdit ? 'Save Package Changes' : 'Create Package'}
        </button>
      </form>
    `;

    openModal(isEdit ? 'Edit Tour Package' : 'Add New Tour Package', formHtml);

    // Handle Image Upload
    const triggerUpload = document.getElementById('triggerPkgUpload');
    const fileInput = document.getElementById('modalPkgFile');
    if (triggerUpload && fileInput) {
      triggerUpload.onclick = () => fileInput.click();
      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          triggerUpload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
          const publicUrl = await window.CholanAPI.uploadMedia(file, 'packages');
          document.getElementById('modalPkgImg').value = publicUrl;
          triggerUpload.innerHTML = '<i class="fa-solid fa-check"></i> Uploaded';
        }
      };
    }

    document.getElementById('pkgModalForm').onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        title: document.getElementById('modalPkgTitle').value,
        slug: document.getElementById('modalPkgSlug').value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: document.getElementById('modalPkgCategory').value,
        category_tag: document.getElementById('modalPkgTag').value,
        duration: document.getElementById('modalPkgDuration').value,
        price: parseFloat(document.getElementById('modalPkgPrice').value),
        image_url: document.getElementById('modalPkgImg').value,
        description: document.getElementById('modalPkgDesc').value
      };

      if (isEdit) {
        await client.from('tour_packages').update(payload).eq('id', pkg.id);
      } else {
        await client.from('tour_packages').insert([payload]);
      }

      closeModal();
      loadPackages();
      loadDashboardStats();
    };
  }

  // 5. Destinations CRUD
  async function loadDestinations() {
    try {
      const { data, error } = await client.from('destinations').select('*').order('created_at', { ascending: true });
      const tbody = document.getElementById('adminDestinationsTable');
      if (!tbody) return;

      if (error || !data || !data.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:25px;">No destinations found.</td></tr>';
        return;
      }

      tbody.innerHTML = data.map(d => `
        <tr>
          <td><img src="${d.image_url}" style="width:60px; height:45px; object-fit:cover; border-radius:4px;"></td>
          <td><strong>${d.name}</strong><br><small style="color:#a89f91;">/${d.slug}</small></td>
          <td><span class="status-badge" style="background:rgba(198,146,60,0.15); color:#c6923c;">${d.category}</span></td>
          <td>${d.subtitle || ''}</td>
          <td>⭐ ${d.rating || '4.8'}</td>
          <td>
            <button class="btn-action btn-del del-dest-btn" data-id="${d.id}"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.del-dest-btn').forEach(btn => {
        btn.onclick = async () => {
          if (confirm('Delete this destination?')) {
            await client.from('destinations').delete().eq('id', btn.getAttribute('data-id'));
            loadDestinations();
            loadDashboardStats();
          }
        };
      });
    } catch (err) {
      console.warn('Error loading destinations:', err);
    }
  }

  const addDestBtn = document.getElementById('addNewDestBtn');
  if (addDestBtn) {
    addDestBtn.onclick = () => {
      const formHtml = `
        <form id="destModalForm">
          <div class="admin-form-grid">
            <div class="admin-form-group">
              <label>Destination Name</label>
              <input type="text" id="modalDestName" class="admin-input" placeholder="e.g. Kumbakonam" required>
            </div>
            <div class="admin-form-group">
              <label>Slug</label>
              <input type="text" id="modalDestSlug" class="admin-input" placeholder="e.g. kumbakonam" required>
            </div>
            <div class="admin-form-group">
              <label>Category</label>
              <input type="text" id="modalDestCat" class="admin-input" placeholder="Heritage, Spiritual, Nature" value="Spiritual">
            </div>
            <div class="admin-form-group">
              <label>Subtitle</label>
              <input type="text" id="modalDestSub" class="admin-input" placeholder="e.g. City of Temples">
            </div>
            <div class="admin-form-group full">
              <label>Image URL or Upload</label>
              <div style="display:flex; gap:10px;">
                <input type="text" id="modalDestImg" class="admin-input" style="flex:1;" placeholder="https://..." required>
                <input type="file" id="modalDestFile" accept="image/*" style="display:none;">
                <button type="button" class="btn-action btn-edit" id="triggerDestUpload"><i class="fa-solid fa-upload"></i> Upload</button>
              </div>
            </div>
            <div class="admin-form-group full">
              <label>Description</label>
              <textarea id="modalDestDesc" class="admin-input" rows="3"></textarea>
            </div>
          </div>
          <button type="submit" class="btn-primary-sm" style="margin-top:15px; width:100%; justify-content:center;">
            <i class="fa-solid fa-plus"></i> Add Destination
          </button>
        </form>
      `;
      openModal('Add New Destination', formHtml);

      const triggerUpload = document.getElementById('triggerDestUpload');
      const fileInput = document.getElementById('modalDestFile');
      if (triggerUpload && fileInput) {
        triggerUpload.onclick = () => fileInput.click();
        fileInput.onchange = async (e) => {
          const file = e.target.files[0];
          if (file) {
            triggerUpload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
            const publicUrl = await window.CholanAPI.uploadMedia(file, 'destinations');
            document.getElementById('modalDestImg').value = publicUrl;
            triggerUpload.innerHTML = '<i class="fa-solid fa-check"></i> Uploaded';
          }
        };
      }

      document.getElementById('destModalForm').onsubmit = async (e) => {
        e.preventDefault();
        await client.from('destinations').insert([{
          name: document.getElementById('modalDestName').value,
          slug: document.getElementById('modalDestSlug').value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          category: document.getElementById('modalDestCat').value,
          subtitle: document.getElementById('modalDestSub').value,
          image_url: document.getElementById('modalDestImg').value,
          description: document.getElementById('modalDestDesc').value,
          attractions: []
        }]);
        closeModal();
        loadDestinations();
        loadDashboardStats();
      };
    };
  }

  // 6. Gallery CRUD
  async function loadGallery() {
    try {
      const { data, error } = await client.from('gallery_items').select('*').order('sort_order', { ascending: true });
      const tbody = document.getElementById('adminGalleryTable');
      if (!tbody) return;

      if (error || !data || !data.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:25px;">No gallery items found.</td></tr>';
        return;
      }

      tbody.innerHTML = data.map(g => `
        <tr>
          <td><img src="${g.image_url}" style="width:65px; height:45px; object-fit:cover; border-radius:4px;"></td>
          <td><strong>${g.title}</strong></td>
          <td>${g.location}</td>
          <td>${g.category}</td>
          <td>
            <button class="btn-action btn-del del-gallery-btn" data-id="${g.id}"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.del-gallery-btn').forEach(btn => {
        btn.onclick = async () => {
          if (confirm('Delete this gallery photo?')) {
            await client.from('gallery_items').delete().eq('id', btn.getAttribute('data-id'));
            loadGallery();
          }
        };
      });
    } catch (err) {
      console.warn('Error loading gallery:', err);
    }
  }

  const addGalBtn = document.getElementById('addNewGalleryBtn');
  if (addGalBtn) {
    addGalBtn.onclick = () => {
      const formHtml = `
        <form id="galleryModalForm">
          <div class="admin-form-grid">
            <div class="admin-form-group full">
              <label>Image Title</label>
              <input type="text" id="modalGalTitle" class="admin-input" placeholder="e.g. Shore Temple at Twilight" required>
            </div>
            <div class="admin-form-group">
              <label>Location</label>
              <input type="text" id="modalGalLoc" class="admin-input" placeholder="e.g. Mahabalipuram, Tamil Nadu" required>
            </div>
            <div class="admin-form-group">
              <label>Category</label>
              <input type="text" id="modalGalCat" class="admin-input" placeholder="heritage, spiritual, scenic" value="heritage">
            </div>
            <div class="admin-form-group full">
              <label>Image Upload or Direct URL</label>
              <div style="display:flex; gap:10px;">
                <input type="text" id="modalGalImg" class="admin-input" style="flex:1;" placeholder="https://..." required>
                <input type="file" id="modalGalFile" accept="image/*" style="display:none;">
                <button type="button" class="btn-action btn-edit" id="triggerGalUpload"><i class="fa-solid fa-upload"></i> Upload</button>
              </div>
            </div>
          </div>
          <button type="submit" class="btn-primary-sm" style="margin-top:15px; width:100%; justify-content:center;">
            <i class="fa-solid fa-plus"></i> Add Gallery Photo
          </button>
        </form>
      `;
      openModal('Upload Gallery Photo', formHtml);

      const triggerUpload = document.getElementById('triggerGalUpload');
      const fileInput = document.getElementById('modalGalFile');
      if (triggerUpload && fileInput) {
        triggerUpload.onclick = () => fileInput.click();
        fileInput.onchange = async (e) => {
          const file = e.target.files[0];
          if (file) {
            triggerUpload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
            const publicUrl = await window.CholanAPI.uploadMedia(file, 'gallery');
            document.getElementById('modalGalImg').value = publicUrl;
            triggerUpload.innerHTML = '<i class="fa-solid fa-check"></i> Uploaded';
          }
        };
      }

      document.getElementById('galleryModalForm').onsubmit = async (e) => {
        e.preventDefault();
        await client.from('gallery_items').insert([{
          title: document.getElementById('modalGalTitle').value,
          location: document.getElementById('modalGalLoc').value,
          category: document.getElementById('modalGalCat').value,
          image_url: document.getElementById('modalGalImg').value
        }]);
        closeModal();
        loadGallery();
      };
    };
  }

  // 7. Blogs CRUD
  async function loadBlogs() {
    try {
      const { data, error } = await client.from('blogs').select('*').order('created_at', { ascending: false });
      const tbody = document.getElementById('adminBlogsTable');
      if (!tbody) return;

      if (error || !data || !data.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:25px;">No blogs found.</td></tr>';
        return;
      }

      tbody.innerHTML = data.map(b => `
        <tr>
          <td><img src="${b.image_url}" style="width:60px; height:45px; object-fit:cover; border-radius:4px;"></td>
          <td><strong>${b.title}</strong></td>
          <td>${b.category_tag}</td>
          <td>${b.read_time}</td>
          <td>${b.is_published ? '✅ Yes' : '❌ No'}</td>
          <td>
            <button class="btn-action btn-del del-blog-btn" data-id="${b.id}"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.del-blog-btn').forEach(btn => {
        btn.onclick = async () => {
          if (confirm('Delete this blog post?')) {
            await client.from('blogs').delete().eq('id', btn.getAttribute('data-id'));
            loadBlogs();
          }
        };
      });
    } catch (err) {
      console.warn('Error loading blogs:', err);
    }
  }

  const addBlogBtn = document.getElementById('addNewBlogBtn');
  if (addBlogBtn) {
    addBlogBtn.onclick = () => {
      const formHtml = `
        <form id="blogModalForm">
          <div class="admin-form-grid">
            <div class="admin-form-group full">
              <label>Blog Title</label>
              <input type="text" id="modalBlogTitle" class="admin-input" placeholder="e.g. Top 10 Temples in Tamil Nadu" required>
            </div>
            <div class="admin-form-group">
              <label>Category Tag</label>
              <input type="text" id="modalBlogTag" class="admin-input" value="Travel Guide" required>
            </div>
            <div class="admin-form-group">
              <label>Read Time</label>
              <input type="text" id="modalBlogReadTime" class="admin-input" value="5 min read" required>
            </div>
            <div class="admin-form-group full">
              <label>Image URL or Upload</label>
              <div style="display:flex; gap:10px;">
                <input type="text" id="modalBlogImg" class="admin-input" style="flex:1;" placeholder="https://..." required>
                <input type="file" id="modalBlogFile" accept="image/*" style="display:none;">
                <button type="button" class="btn-action btn-edit" id="triggerBlogUpload"><i class="fa-solid fa-upload"></i> Upload</button>
              </div>
            </div>
            <div class="admin-form-group full">
              <label>Summary</label>
              <textarea id="modalBlogSummary" class="admin-input" rows="2" placeholder="Brief summary of the article..." required></textarea>
            </div>
            <div class="admin-form-group full">
              <label>Full Content</label>
              <textarea id="modalBlogContent" class="admin-input" rows="4" placeholder="Full article content..."></textarea>
            </div>
          </div>
          <button type="submit" class="btn-primary-sm" style="margin-top:15px; width:100%; justify-content:center;">
            <i class="fa-solid fa-newspaper"></i> Publish Blog Post
          </button>
        </form>
      `;
      openModal('Write New Blog Post', formHtml);

      const triggerUpload = document.getElementById('triggerBlogUpload');
      const fileInput = document.getElementById('modalBlogFile');
      if (triggerUpload && fileInput) {
        triggerUpload.onclick = () => fileInput.click();
        fileInput.onchange = async (e) => {
          const file = e.target.files[0];
          if (file) {
            triggerUpload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
            const publicUrl = await window.CholanAPI.uploadMedia(file, 'blogs');
            document.getElementById('modalBlogImg').value = publicUrl;
            triggerUpload.innerHTML = '<i class="fa-solid fa-check"></i> Uploaded';
          }
        };
      }

      document.getElementById('blogModalForm').onsubmit = async (e) => {
        e.preventDefault();
        const title = document.getElementById('modalBlogTitle').value;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        await client.from('blogs').insert([{
          title,
          slug,
          category_tag: document.getElementById('modalBlogTag').value,
          read_time: document.getElementById('modalBlogReadTime').value,
          summary: document.getElementById('modalBlogSummary').value,
          content: document.getElementById('modalBlogContent').value,
          image_url: document.getElementById('modalBlogImg').value,
          is_published: true
        }]);
        closeModal();
        loadBlogs();
      };
    };
  }

  // 8. Banners CRUD
  async function loadBanners() {
    try {
      const { data, error } = await client.from('hero_banners').select('*').order('sort_order', { ascending: true });
      const tbody = document.getElementById('adminBannersTable');
      if (!tbody) return;

      if (error || !data || !data.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:25px;">No banners found.</td></tr>';
        return;
      }

      tbody.innerHTML = data.map(bn => `
        <tr>
          <td><img src="${bn.image_url}" style="width:70px; height:45px; object-fit:cover; border-radius:4px;"></td>
          <td><span class="status-badge" style="background:rgba(198,146,60,0.15); color:#c6923c;">${bn.badge}</span></td>
          <td><strong>${bn.title}</strong><br><small style="color:#a89f91;">${bn.description ? bn.description.substring(0, 45) + '...' : ''}</small></td>
          <td>${bn.sort_order}</td>
          <td>
            <button class="status-badge toggle-ban-btn ${bn.is_active ? 'status-confirmed' : 'status-cancelled'}" data-id="${bn.id}" data-active="${bn.is_active}" style="cursor:pointer; border:none;">
              ${bn.is_active ? '✅ Active' : '❌ Inactive'}
            </button>
          </td>
          <td>
            <button class="btn-action btn-edit edit-ban-btn" data-id="${bn.id}"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-action btn-del del-banner-btn" data-id="${bn.id}"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>
      `).join('');

      // Toggle active
      document.querySelectorAll('.toggle-ban-btn').forEach(btn => {
        btn.onclick = async () => {
          const id = btn.getAttribute('data-id');
          const currentActive = btn.getAttribute('data-active') === 'true';
          await client.from('hero_banners').update({ is_active: !currentActive }).eq('id', id);
          loadBanners();
        };
      });

      // Edit banner
      document.querySelectorAll('.edit-ban-btn').forEach(btn => {
        btn.onclick = () => {
          const id = btn.getAttribute('data-id');
          const bn = data.find(b => b.id === id);
          if (!bn) return;

          const formHtml = `
            <form id="bannerEditModalForm">
              <div class="admin-form-grid">
                <div class="admin-form-group">
                  <label>Banner Badge</label>
                  <input type="text" id="modalBanBadge" class="admin-input" value="${bn.badge || ''}" required>
                </div>
                <div class="admin-form-group">
                  <label>Sort Order</label>
                  <input type="number" id="modalBanOrder" class="admin-input" value="${bn.sort_order || 1}" required>
                </div>
                <div class="admin-form-group full">
                  <label>Banner Title</label>
                  <input type="text" id="modalBanTitle" class="admin-input" value="${bn.title || ''}" required>
                </div>
                <div class="admin-form-group full">
                  <label>Image URL or Upload</label>
                  <div style="display:flex; gap:10px;">
                    <input type="text" id="modalBanImg" class="admin-input" style="flex:1;" value="${bn.image_url || ''}" required>
                    <input type="file" id="modalBanFile" accept="image/*" style="display:none;">
                    <button type="button" class="btn-action btn-edit" id="triggerBanUpload"><i class="fa-solid fa-upload"></i> Upload</button>
                  </div>
                </div>
                <div class="admin-form-group full">
                  <label>Description</label>
                  <textarea id="modalBanDesc" class="admin-input" rows="2" required>${bn.description || ''}</textarea>
                </div>
                <div class="admin-form-group">
                  <label>Button 1 Text</label>
                  <input type="text" id="modalBanBtn1Text" class="admin-input" value="${bn.btn1_text || 'Explore Tours'}">
                </div>
                <div class="admin-form-group">
                  <label>Button 1 Link</label>
                  <input type="text" id="modalBanBtn1Link" class="admin-input" value="${bn.btn1_link || 'packages.html'}">
                </div>
              </div>
              <button type="submit" class="btn-primary-sm" style="margin-top:15px; width:100%; justify-content:center;">
                <i class="fa-solid fa-floppy-disk"></i> Update Hero Banner
              </button>
            </form>
          `;
          openModal('Edit Hero Banner Slide', formHtml);

          const triggerUpload = document.getElementById('triggerBanUpload');
          const fileInput = document.getElementById('modalBanFile');
          if (triggerUpload && fileInput) {
            triggerUpload.onclick = () => fileInput.click();
            fileInput.onchange = async (e) => {
              const file = e.target.files[0];
              if (file) {
                triggerUpload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
                const publicUrl = await window.CholanAPI.uploadMedia(file, 'banners');
                document.getElementById('modalBanImg').value = publicUrl;
                triggerUpload.innerHTML = '<i class="fa-solid fa-check"></i> Uploaded';
              }
            };
          }

          document.getElementById('bannerEditModalForm').onsubmit = async (e) => {
            e.preventDefault();
            const { error: updateError } = await client.from('hero_banners').update({
              badge: document.getElementById('modalBanBadge').value,
              title: document.getElementById('modalBanTitle').value,
              description: document.getElementById('modalBanDesc').value,
              image_url: document.getElementById('modalBanImg').value,
              sort_order: parseInt(document.getElementById('modalBanOrder').value, 10) || 1,
              btn1_text: document.getElementById('modalBanBtn1Text').value,
              btn1_link: document.getElementById('modalBanBtn1Link').value
            }).eq('id', id);

            if (updateError) {
              alert('Error updating banner: ' + updateError.message);
            } else {
              closeModal();
              loadBanners();
            }
          };
        };
      });

      // Delete banner
      document.querySelectorAll('.del-banner-btn').forEach(btn => {
        btn.onclick = async () => {
          if (confirm('Delete this hero banner?')) {
            const { error: delError } = await client.from('hero_banners').delete().eq('id', btn.getAttribute('data-id'));
            if (delError) {
              alert('Error deleting banner: ' + delError.message);
            } else {
              loadBanners();
            }
          }
        };
      });
    } catch (err) {
      console.warn('Error loading banners:', err);
    }
  }

  const addBannerBtn = document.getElementById('addNewBannerBtn');
  if (addBannerBtn) {
    addBannerBtn.onclick = () => {
      const formHtml = `
        <form id="bannerModalForm">
          <div class="admin-form-grid">
            <div class="admin-form-group">
              <label>Banner Badge</label>
              <input type="text" id="modalBanBadge" class="admin-input" placeholder="e.g. Spiritual Tours" required>
            </div>
            <div class="admin-form-group">
              <label>Sort Order</label>
              <input type="number" id="modalBanOrder" class="admin-input" value="1" required>
            </div>
            <div class="admin-form-group full">
              <label>Banner Title</label>
              <input type="text" id="modalBanTitle" class="admin-input" placeholder="e.g. Discover the Soul of South India" required>
            </div>
            <div class="admin-form-group full">
              <label>Image URL or Upload</label>
              <div style="display:flex; gap:10px;">
                <input type="text" id="modalBanImg" class="admin-input" style="flex:1;" placeholder="https://..." required>
                <input type="file" id="modalBanFile" accept="image/*" style="display:none;">
                <button type="button" class="btn-action btn-edit" id="triggerBanUpload"><i class="fa-solid fa-upload"></i> Upload</button>
              </div>
            </div>
            <div class="admin-form-group full">
              <label>Description</label>
              <textarea id="modalBanDesc" class="admin-input" rows="2" placeholder="Banner description text..." required></textarea>
            </div>
            <div class="admin-form-group">
              <label>Button 1 Text</label>
              <input type="text" id="modalBanBtn1Text" class="admin-input" value="Explore Tours">
            </div>
            <div class="admin-form-group">
              <label>Button 1 Link</label>
              <input type="text" id="modalBanBtn1Link" class="admin-input" value="packages.html">
            </div>
          </div>
          <button type="submit" class="btn-primary-sm" style="margin-top:15px; width:100%; justify-content:center;">
            <i class="fa-solid fa-images"></i> Add Hero Banner
          </button>
        </form>
      `;
      openModal('Add Hero Banner Slide', formHtml);

      const triggerUpload = document.getElementById('triggerBanUpload');
      const fileInput = document.getElementById('modalBanFile');
      if (triggerUpload && fileInput) {
        triggerUpload.onclick = () => fileInput.click();
        fileInput.onchange = async (e) => {
          const file = e.target.files[0];
          if (file) {
            triggerUpload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
            const publicUrl = await window.CholanAPI.uploadMedia(file, 'banners');
            document.getElementById('modalBanImg').value = publicUrl;
            triggerUpload.innerHTML = '<i class="fa-solid fa-check"></i> Uploaded';
          }
        };
      }

      document.getElementById('bannerModalForm').onsubmit = async (e) => {
        e.preventDefault();
        const { error: insError } = await client.from('hero_banners').insert([{
          badge: document.getElementById('modalBanBadge').value,
          title: document.getElementById('modalBanTitle').value,
          description: document.getElementById('modalBanDesc').value,
          image_url: document.getElementById('modalBanImg').value,
          btn1_text: document.getElementById('modalBanBtn1Text').value || 'Explore Tours',
          btn1_link: document.getElementById('modalBanBtn1Link').value || 'packages.html',
          btn2_text: 'Contact Us',
          btn2_link: 'contact.html',
          sort_order: parseInt(document.getElementById('modalBanOrder').value, 10) || 1,
          is_active: true
        }]);

        if (insError) {
          alert('Error adding banner: ' + insError.message);
        } else {
          closeModal();
          loadBanners();
        }
      };
    };
  }

  // 9. Site Settings
  async function loadSettings() {
    const { data } = await client.from('site_settings').select('*').limit(1).single();
    if (!data) return;

    document.getElementById('settingSiteName').value = data.site_name || '';
    document.getElementById('settingTagline').value = data.tagline || '';
    document.getElementById('settingPhone').value = data.phone || '';
    document.getElementById('settingWhatsapp').value = data.whatsapp || '';
    document.getElementById('settingEmail').value = data.email || '';
    document.getElementById('settingAddress').value = data.address || '';
  }

  document.getElementById('adminSettingsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fb = document.getElementById('settingsFeedback');
    if (fb) fb.innerHTML = '<span style="color:#facc15;">Saving...</span>';

    const payload = {
      site_name: document.getElementById('settingSiteName').value,
      tagline: document.getElementById('settingTagline').value,
      phone: document.getElementById('settingPhone').value,
      whatsapp: document.getElementById('settingWhatsapp').value,
      email: document.getElementById('settingEmail').value,
      address: document.getElementById('settingAddress').value
    };

    const { data: existing } = await client.from('site_settings').select('id').limit(1).single();
    let error = null;
    if (existing) {
      const res = await client.from('site_settings').update(payload).eq('id', existing.id);
      error = res.error;
    } else {
      const res = await client.from('site_settings').insert([payload]);
      error = res.error;
    }

    if (error) {
      if (fb) fb.innerHTML = `<span style="color:#f87171;">Error: ${error.message}</span>`;
    } else {
      if (fb) fb.innerHTML = '<span style="color:#4ade80;">Settings saved successfully!</span>';
      setTimeout(() => { if (fb) fb.textContent = ''; }, 3000);
    }
  });

  // Load all admin data
  loadAllAdminData();
});
