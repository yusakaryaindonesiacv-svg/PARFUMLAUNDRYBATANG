import { getStorageData, STORAGE_KEYS } from './storage';
import { Product, Order, Customer, Expense, Coupon, StoreSettings } from '../types';

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * GOOGLE APPS SCRIPT FOR PARFUM LAUNDRY BATANG
 * 
 * CARA MEMASANG:
 * 1. Buka Google Sheets Baru di sheets.google.com
 * 2. Klik menu Extensi -> Apps Script
 * 3. Hapus semua kode bawaan, lalu Paste KODE LENGKAP INI
 * 4. Klik "Simpan" (ikon disket)
 * 5. Klik "Deploy" -> "Deployment Baru"
 * 6. Pilih Jenis: "Aplikasi Web" (Web App)
 * 7. Akses: "Siapa Saja" (Anyone)
 * 8. Klik Deploy -> Salin URL Aplikasi Web yang dihasilkan
 * 9. Tempelkan URL tersebut di Pengaturan Toko "Google Sheets Web App URL"
 */

function doGet(e) {
  var action = e.parameter.action;
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Inisialisasi sheet otomatis jika belum ada
  initSheets(sheet);
  
  if (action === 'get_all') {
    return jsonResponse({
      products: getSheetData(sheet.getSheetByName('Produk')),
      orders: getSheetData(sheet.getSheetByName('Pesanan')),
      customers: getSheetData(sheet.getSheetByName('Pelanggan')),
      expenses: getSheetData(sheet.getSheetByName('Pengeluaran')),
      coupons: getSheetData(sheet.getSheetByName('Kupon'))
    });
  }
  
  return jsonResponse({ status: 'active', message: 'API Google Sheets Parfum Laundry Batang SIAP!' });
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    initSheets(sheet);
    
    if (data.action === 'sync_all') {
      if (data.products) saveToSheet(sheet.getSheetByName('Produk'), data.products);
      if (data.orders) saveToSheet(sheet.getSheetByName('Pesanan'), data.orders);
      if (data.customers) saveToSheet(sheet.getSheetByName('Pelanggan'), data.customers);
      if (data.expenses) saveToSheet(sheet.getSheetByName('Pengeluaran'), data.expenses);
      if (data.coupons) saveToSheet(sheet.getSheetByName('Kupon'), data.coupons);
      
      return jsonResponse({ success: true, message: 'Sinkronisasi Google Sheets Berhasil!' });
    }
    
    return jsonResponse({ success: false, message: 'Aksi tidak dikenal.' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function initSheets(ss) {
  var sheetNames = ['Produk', 'Pesanan', 'Pelanggan', 'Pengeluaran', 'Kupon'];
  sheetNames.forEach(function(name) {
    if (!ss.getSheetByName(name)) {
      var newSheet = ss.insertSheet(name);
      if (name === 'Produk') newSheet.appendRow(['ID', 'Kode', 'Nama Produk', 'Kategori', 'Aroma', 'Harga Ritel', 'Stok', 'Updated']);
      if (name === 'Pesanan') newSheet.appendRow(['No. Pesanan', 'Pelanggan', 'HP', 'Alamat', 'Total', 'Metode Bayar', 'Status Bayar', 'Status Kirim', 'Tanggal']);
      if (name === 'Pelanggan') newSheet.appendRow(['ID', 'Nama Pelanggan', 'No HP', 'Alamat', 'Poin', 'Level Tier', 'Total Belanja', 'Piutang']);
      if (name === 'Pengeluaran') newSheet.appendRow(['ID', 'Judul', 'Kategori', 'Jumlah', 'Tanggal', 'Catatan']);
      if (name === 'Kupon') newSheet.appendRow(['Kode', 'Tipe Diskon', 'Nilai Diskon', 'Minimal Belanja', 'Status']);
    }
  });
}

function saveToSheet(sheet, items) {
  if (!items || !items.length) return;
  sheet.clearContents();
  // Headers
  var headers = Object.keys(items[0]);
  sheet.appendRow(headers);
  
  items.forEach(function(item) {
    var row = headers.map(function(k) {
      var val = item[k];
      return typeof val === 'object' ? JSON.stringify(val) : val;
    });
    sheet.appendRow(row);
  });
}

function getSheetData(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    result.push(obj);
  }
  return result;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export async function syncDataToGoogleSheets(url: string): Promise<{ success: boolean; message: string }> {
  if (!url) {
    return { success: false, message: 'URL Web App Google Sheets belum diatur.' };
  }

  try {
    const products = getStorageData<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const orders = getStorageData<Order[]>(STORAGE_KEYS.ORDERS, []);
    const customers = getStorageData<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const expenses = getStorageData<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    const coupons = getStorageData<Coupon[]>(STORAGE_KEYS.COUPONS, []);

    const payload = {
      action: 'sync_all',
      products,
      orders,
      customers,
      expenses,
      coupons,
    };

    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });

    const resJson = await response.json();
    if (resJson.success) {
      return { success: true, message: 'Data Toko berhasil dikirim & disinkronkan ke Google Sheets!' };
    } else {
      return { success: false, message: resJson.message || 'Respon Google Sheets tidak valid.' };
    }
  } catch (err: any) {
    console.error('Error sync Google Sheets:', err);
    return { success: false, message: `Gagal menghubungi Google Sheets: ${err.message || err}` };
  }
}
