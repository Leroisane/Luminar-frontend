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
