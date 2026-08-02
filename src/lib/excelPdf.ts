import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Product, Order, Customer, Expense } from '../types';

// Format Rupiah helper
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format Date helper
export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 1. Export Products to Excel
export function exportProductsToExcel(products: Product[]) {
  const rows = products.flatMap(p => 
    p.volumes.map(v => ({
      'Kode SKU': p.code,
      'Nama Produk': p.name,
      'Kategori': p.category,
      'Aroma Family': p.scentFamily,
      'Varian Ukuran': v.name,
      'Volume (ml)': v.volumeMl,
      'Harga Eceran (Rp)': v.price,
      'Harga Grosir (Rp)': v.wholesalePrice,
      'Min Qty Grosir': v.wholesaleMinQty,
      'Modal HPP (Rp)': v.cogs,
      'Stok': v.stock,
      'Deskripsi': p.description,
    }))
  );

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Produk');
  XLSX.writeFile(workbook, `Produk_ParfumLaundryBatang_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// 2. Export Orders to Excel
export function exportOrdersToExcel(orders: Order[]) {
  const rows = orders.map(o => ({
    'No. Pesanan': o.orderNumber,
    'Tanggal': formatDateIndo(o.createdAt),
    'Nama Pelanggan': o.customerName,
    'No. HP': o.customerPhone,
    'Alamat': o.customerAddress,
    'Item Dibeli': o.items.map(i => `${i.productName} (${i.volumeName}) x${i.quantity}`).join('; '),
    'Subtotal (Rp)': o.subtotal,
    'Diskon (Rp)': o.discountAmount,
    'Ongkir (Rp)': o.shippingFee,
    'Total Bayar (Rp)': o.totalAmount,
    'Total HPP/Modal (Rp)': o.totalCogs,
    'Estimasi Laba Kotor (Rp)': o.totalAmount - o.totalCogs,
    'Metode Bayar': o.paymentMethod,
    'Status Bayar': o.paymentStatus,
    'Status Kirim': o.orderStatus,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Pesanan');
  XLSX.writeFile(workbook, `Laporan_Pesanan_Batang_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// 3. Export Financial Profit & Loss to PDF
export function exportProfitLossPDF(
  revenue: number,
  cogs: number,
  expenses: Expense[],
  totalExpenses: number,
  startDate: string,
  endDate: string
) {
  const doc = new jsPDF();
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - totalExpenses;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PARFUM LAUNDRY BATANG', 105, 18, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('LAPORAN LABA RUGI OPERASIONAL', 105, 25, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Periode: ${startDate || 'Semua'} s/d ${endDate || 'Hari Ini'}`, 105, 31, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.line(15, 36, 195, 36);

  let y = 45;

  // Revenue section
  doc.setFont('helvetica', 'bold');
  doc.text('1. PENJUALAN & PENDAPATAN', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Omzet Penjualan:', 25, y + 7);
  doc.text(formatRupiah(revenue), 195, y + 7, { align: 'right' });

  // COGS section
  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.text('2. HARGA POKOK PENJUALAN (HPP / MODAL)', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text('Total HPP Bahan Baku & Botol:', 25, y + 7);
  doc.text(`(${formatRupiah(cogs)})`, 195, y + 7, { align: 'right' });

  // Gross Profit
  y += 18;
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y - 2, 180, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('LABA KOTOR (GROSS PROFIT):', 20, y + 5);
  doc.text(formatRupiah(grossProfit), 190, y + 5, { align: 'right' });

  // Operational Expenses
  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.text('3. BEBAN OPERASIONAL (EXPENSES)', 15, y);
  
  y += 7;
  doc.setFont('helvetica', 'normal');
  if (expenses.length === 0) {
    doc.text('- Tidak ada beban operasional tercatat', 25, y);
    y += 7;
  } else {
    expenses.forEach((exp) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.text(`• ${exp.title} (${exp.category})`, 25, y);
      doc.text(`(${formatRupiah(exp.amount)})`, 195, y, { align: 'right' });
      y += 6;
    });
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Total Beban Operasional:', 25, y + 2);
  doc.text(`(${formatRupiah(totalExpenses)})`, 195, y + 2, { align: 'right' });

  // Net Profit
  y += 15;
  doc.setDrawColor(79, 70, 229);
  doc.setFillColor(238, 242, 255);
  doc.rect(15, y, 180, 12, 'FD');
  doc.setFontSize(11);
  doc.text('LABA BERSIH (NET PROFIT):', 20, y + 8);
  doc.text(formatRupiah(netProfit), 190, y + 8, { align: 'right' });

  // Signature
  y += 30;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Batang, ' + new Date().toLocaleDateString('id-ID'), 140, y);
  doc.text('Manajemen Parfum Laundry Batang', 140, y + 15);

  doc.save(`Laporan_Laba_Rugi_Batang_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// 4. Excel Import Helper for Products
export async function parseProductsExcel(file: File): Promise<Partial<Product>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);
        
        // Group rows by product SKU or name
        const productMap = new Map<string, Partial<Product>>();

        json.forEach((row, idx) => {
          const sku = row['Kode SKU'] || row['SKU'] || `PLB-IMP-${idx}`;
          const name = row['Nama Produk'] || row['Nama'] || 'Produk Import';
          const category = row['Kategori'] || 'Parfum Premium Waterbased';
          const scentFamily = row['Aroma Family'] || 'Floral';

          if (!productMap.has(sku)) {
            productMap.set(sku, {
              id: `prod-imp-${Date.now()}-${idx}`,
              code: sku,
              name,
              category,
              scentFamily,
              description: row['Deskripsi'] || 'Parfum laundry aroma berkualitas.',
              imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
              rating: 4.8,
              createdAt: new Date().toISOString(),
              volumes: [],
            });
          }

          const prod = productMap.get(sku)!;
          prod.volumes = prod.volumes || [];
          prod.volumes.push({
            id: `vol-imp-${Date.now()}-${idx}`,
            name: row['Varian Ukuran'] || '1 Liter',
            volumeMl: Number(row['Volume (ml)']) || 1000,
            price: Number(row['Harga Eceran (Rp)']) || 35000,
            wholesalePrice: Number(row['Harga Grosir (Rp)']) || 30000,
            wholesaleMinQty: Number(row['Min Qty Grosir']) || 3,
            cogs: Number(row['Modal HPP (Rp)']) || 20000,
            stock: Number(row['Stok']) || 20,
          });
        });

        resolve(Array.from(productMap.values()));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
