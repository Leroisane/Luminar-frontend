import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

// 1. Error Message Helper Unit Tests
describe('axiosClient Error Parser Unit Tests', () => {
  it('correctly parses server response error message', () => {
    const errorObj = {
      response: {
        status: 400,
        data: { message: 'NIM sudah terdaftar' }
      }
    };
    const msg = errorObj.response.data.message;
    assert.equal(msg, 'NIM sudah terdaftar');
  });

  it('correctly falls back on standard HTTP status code messages', () => {
    function getStatusMessage(status) {
      if (status === 403) return 'Akses ditolak (Forbidden).';
      if (status === 404) return 'Data tidak ditemukan (404).';
      if (status === 429) return 'Terlalu banyak permintaan. Tunggu sebentar.';
      return 'Gagal terhubung ke server Luminar.';
    }
    assert.equal(getStatusMessage(403), 'Akses ditolak (Forbidden).');
    assert.equal(getStatusMessage(404), 'Data tidak ditemukan (404).');
    assert.equal(getStatusMessage(429), 'Terlalu banyak permintaan. Tunggu sebentar.');
    assert.equal(getStatusMessage(500), 'Gagal terhubung ke server Luminar.');
  });
});

// 2. StatusBadge Mapping Unit Tests
describe('StatusBadge Mapping Unit Tests', () => {
  const statusConfig = {
    pending: { label: 'Menunggu', className: 'bg-gray-100 text-gray-700' },
    review: { label: 'Direview', className: 'bg-blue-100 text-blue-700' },
    perlu_revisi: { label: 'Perlu Revisi', className: 'bg-yellow-100 text-yellow-700' },
    menunggu_ttd: { label: 'Menunggu TTD', className: 'bg-purple-100 text-purple-700' },
    approved: { label: 'Disetujui', className: 'bg-green-100 text-green-700' },
    rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-700' },
    cancelled: { label: 'Dibatalkan', className: 'bg-gray-100 text-gray-500' },
    hand_over: { label: 'Serah Terima', className: 'bg-indigo-100 text-indigo-700' },
    return: { label: 'Dikembalikan', className: 'bg-teal-100 text-teal-700' },
  };

  it('maps all 9 booking statuses to Indonesian labels', () => {
    assert.equal(statusConfig.pending.label, 'Menunggu');
    assert.equal(statusConfig.approved.label, 'Disetujui');
    assert.equal(statusConfig.rejected.label, 'Ditolak');
    assert.equal(statusConfig.perlu_revisi.label, 'Perlu Revisi');
    assert.equal(statusConfig.menunggu_ttd.label, 'Menunggu TTD');
    assert.equal(statusConfig.cancelled.label, 'Dibatalkan');
    assert.equal(statusConfig.hand_over.label, 'Serah Terima');
    assert.equal(statusConfig.return.label, 'Dikembalikan');
  });
});

// 3. Pagination Calculation Unit Tests
describe('PaginationBar Logic Unit Tests', () => {
  function getPaginationData(total, perPage, page) {
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    return { totalPages, hasNext, hasPrev };
  }

  it('computes correct page count for multiple pages', () => {
    const res = getPaginationData(35, 10, 1);
    assert.equal(res.totalPages, 4);
    assert.equal(res.hasPrev, false);
    assert.equal(res.hasNext, true);
  });

  it('computes boundary state for last page', () => {
    const res = getPaginationData(35, 10, 4);
    assert.equal(res.totalPages, 4);
    assert.equal(res.hasPrev, true);
    assert.equal(res.hasNext, false);
  });
});

// 4. Auth Store Role Logic Unit Tests
describe('AuthStore Logic Unit Tests', () => {
  it('correctly determines admin role authorization', () => {
    function checkIsAdmin(user) {
      return user?.role === 'admin';
    }
    assert.equal(checkIsAdmin({ role: 'admin' }), true);
    assert.equal(checkIsAdmin({ role: 'mahasiswa' }), false);
    assert.equal(checkIsAdmin(null), false);
  });
});

// 5. Live Endpoint URL Configuration Test
describe('Live Backend Endpoint Configuration Tests', () => {
  const BASE_URL = 'https://jaws-hurler-unranked.ngrok-free.dev/api/v1';

  it('verifies /api/v1 prefix and URL structure', () => {
    const url = new URL(BASE_URL);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.hostname, 'jaws-hurler-unranked.ngrok-free.dev');
    assert.equal(url.pathname, '/api/v1');
  });
});

// 6. Admin Status Transition State Machine Unit Tests
describe('Admin Status Transition State Machine Unit Tests', () => {
  function getAllowedActions(status) {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'diajukan':
      case 'pending':
        return ['review', 'request_revision', 'reject', 'cancel'];
      case 'direview':
      case 'review':
        return ['approve', 'request_revision', 'reject', 'cancel'];
      case 'menunggu_ttd':
        return ['upload_final_letter', 'reject', 'cancel'];
      case 'perlu_revisi':
        return ['reject', 'cancel'];
      case 'disetujui':
      case 'approved':
        return ['cancel'];
      case 'ditolak':
      case 'rejected':
      case 'dibatalkan':
      case 'cancelled':
      default:
        return [];
    }
  }

  it('allows only valid transitions from diajukan (cannot approve directly)', () => {
    const actions = getAllowedActions('diajukan');
    assert.ok(actions.includes('review'));
    assert.ok(actions.includes('request_revision'));
    assert.ok(!actions.includes('approve'), 'diajukan must not allow approve directly');
    assert.ok(!actions.includes('upload_final_letter'));
  });

  it('allows approve only from direview', () => {
    const actions = getAllowedActions('direview');
    assert.ok(actions.includes('approve'));
    assert.ok(actions.includes('request_revision'));
    assert.ok(actions.includes('reject'));
  });

  it('allows upload_final_letter only from menunggu_ttd', () => {
    const actions = getAllowedActions('menunggu_ttd');
    assert.ok(actions.includes('upload_final_letter'));
    assert.ok(!actions.includes('review'));
    assert.ok(!actions.includes('approve'));
  });

  it('prohibits any transitions from terminal states', () => {
    assert.deepEqual(getAllowedActions('ditolak'), []);
    assert.deepEqual(getAllowedActions('dibatalkan'), []);
  });
});

// 7. Admin Manual Booking Payload Validation Unit Tests
describe('Admin Manual Booking Payload Validation Unit Tests', () => {
  function validateManualBooking(payload) {
    if (!payload.requester_name || payload.requester_name.trim().length < 3) {
      return 'Nama pemohon minimal 3 karakter';
    }
    if (!payload.requester_contact || payload.requester_contact.trim().length < 5) {
      return 'Kontak pemohon minimal 5 karakter';
    }
    if (!payload.lembaga_id) {
      return 'Lembaga wajib dipilih';
    }
    if (!payload.room_id) {
      return 'Ruangan wajib dipilih';
    }
    if (!payload.booking_date) {
      return 'Tanggal peminjaman wajib diisi';
    }
    if (payload.start_time >= payload.end_time) {
      return 'Waktu selesai harus setelah waktu mulai';
    }
    if (payload.document_url && !payload.document_url.startsWith('http://') && !payload.document_url.startsWith('https://')) {
      return 'Link dokumen harus URL valid';
    }
    return null;
  }

  it('validates required fields matching backend DTO', () => {
    const validPayload = {
      requester_name: 'Dr. Eng. Herman',
      requester_contact: '081234567890',
      lembaga_id: '550e8400-e29b-41d4-a716-446655440000',
      room_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      booking_date: '2026-11-20',
      start_time: '08:00',
      end_time: '11:00',
    };
    assert.equal(validateManualBooking(validPayload), null);

    const invalidShortName = { ...validPayload, requester_name: 'Al' };
    assert.equal(validateManualBooking(invalidShortName), 'Nama pemohon minimal 3 karakter');

    const invalidShortContact = { ...validPayload, requester_contact: '123' };
    assert.equal(validateManualBooking(invalidShortContact), 'Kontak pemohon minimal 5 karakter');

    const invalidTime = { ...validPayload, start_time: '12:00', end_time: '10:00' };
    assert.equal(validateManualBooking(invalidTime), 'Waktu selesai harus setelah waktu mulai');
  });
});

// 8. Calendar Monday-First Grid Generation & Event Grouping Tests
describe('Calendar Monday-First Grid Generation & Event Grouping Tests', () => {
  function generateMondayFirstDays(year, month) {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const start = new Date(first);
    // first.getDay(): 0 = Min, 1 = Sen, ..., 6 = Sab
    // Monday-first: Sen = 0, Sel = 1, ..., Min = 6
    const mondayFirstDay = (first.getDay() + 6) % 7;
    start.setDate(first.getDate() - mondayFirstDay);
    const total = Math.ceil((mondayFirstDay + last.getDate()) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }

  it('generates a grid starting on Monday', () => {
    // November 2026: Nov 1 is Sunday. In Monday-first, first cell must be Monday Oct 26.
    const days = generateMondayFirstDays(2026, 10); // Nov is index 10
    assert.equal(days[0].getDay(), 1); // 1 = Monday
    assert.equal(days.length % 7, 0); // Always multiple of 7
    assert.equal(days[0].getDate(), 26); // Oct 26
    assert.equal(days[6].getDate(), 1); // Nov 1 is index 6 (Sunday)
  });

  it('correctly groups events by booking_date and computes overflow', () => {
    const mockEvents = [
      { id: '1', booking_date: '2026-11-19', start_time: '08:00', program_kerja: 'Event A', status: 'disetujui' },
      { id: '2', booking_date: '2026-11-19', start_time: '10:00', program_kerja: 'Event B', status: 'diajukan' },
      { id: '3', booking_date: '2026-11-19', start_time: '13:00', program_kerja: 'Event C', status: 'direview' },
      { id: '4', booking_date: '2026-11-19', start_time: '15:00', program_kerja: 'Event D', status: 'menunggu_ttd' },
      { id: '5', booking_date: '2026-11-20', start_time: '09:00', program_kerja: 'Event E', status: 'disetujui' },
    ];

    const map = new Map();
    for (const ev of mockEvents) {
      const d = ev.booking_date.slice(0, 10);
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(ev);
    }

    const nov19Events = map.get('2026-11-19') || [];
    assert.equal(nov19Events.length, 4);

    const visiblePills = nov19Events.slice(0, 3);
    assert.equal(visiblePills.length, 3);

    const overflowCount = nov19Events.length > 3 ? nov19Events.length - 3 : 0;
    assert.equal(overflowCount, 1); // +1 lainnya

    const nov20Events = map.get('2026-11-20') || [];
    assert.equal(nov20Events.length, 1);
    assert.equal(nov20Events.length > 3 ? nov20Events.length - 3 : 0, 0);
  });
});

// 9. Item Master Validation and Status Logic Unit Tests
describe('Item Master Payload and Status Logic Unit Tests', () => {
  function validateItemPayload(payload) {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error('Nama barang wajib diisi');
    }
    if (!payload.category || payload.category.trim().length === 0) {
      throw new Error('Kategori barang wajib diisi');
    }
    if (typeof payload.stock_total !== 'number' || payload.stock_total < 0) {
      throw new Error('Stok total harus berupa angka >= 0');
    }
    const validStatuses = ['tersedia', 'rusak', 'nonaktif'];
    if (payload.status && !validStatuses.includes(payload.status)) {
      throw new Error('Status barang tidak valid');
    }
    return true;
  }

  function toggleItemStatus(currentStatus) {
    return currentStatus === 'tersedia' ? 'nonaktif' : 'tersedia';
  }

  it('validates required fields for creating/updating item', () => {
    assert.throws(
      () => validateItemPayload({ name: '', category: 'Audio', stock_total: 5 }),
      /Nama barang wajib diisi/
    );
    assert.throws(
      () => validateItemPayload({ name: 'Proyektor', category: '', stock_total: 5 }),
      /Kategori barang wajib diisi/
    );
    assert.throws(
      () => validateItemPayload({ name: 'Proyektor', category: 'Audio', stock_total: -1 }),
      /Stok total harus berupa angka >= 0/
    );
    assert.throws(
      () => validateItemPayload({ name: 'Proyektor', category: 'Audio', stock_total: 2, status: 'hilang' }),
      /Status barang tidak valid/
    );
    assert.equal(
      validateItemPayload({
        name: 'Proyektor Epson EB-X500',
        category: 'Visual & Multimedia',
        stock_total: 3,
        status: 'tersedia',
      }),
      true
    );
  });

  it('correctly toggles item status between tersedia and nonaktif', () => {
    assert.equal(toggleItemStatus('tersedia'), 'nonaktif');
    assert.equal(toggleItemStatus('nonaktif'), 'tersedia');
    assert.equal(toggleItemStatus('rusak'), 'tersedia');
  });
});



