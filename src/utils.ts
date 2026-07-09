// Utilities for Number formatting and Word conversion in English and Bengali

/**
 * Format number with commas
 */
export function formatCurrency(amount: number, locale: 'bn' | 'en' = 'bn'): string {
  if (locale === 'bn') {
    // Standard Indian/Bangladeshi numbering system formatting (e.g., 12,34,567.89)
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Convert numbers to Bengali digits
 */
export function toBengaliDigits(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num
    .toString()
    .replace(/[0-9]/g, (w) => bengaliDigits[parseInt(w, 10)]);
}

/**
 * Convert number to Bengali words (টাকা কথায়)
 */
export function numberToBengaliWords(amount: number): string {
  if (amount === 0) return 'শূণ্য টাকা মাত্র';

  const units = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
  const teens = ['দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ'];
  const tens = ['', 'দশ', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];

  function convertLessThanThousand(n: number): string {
    let result = '';
    
    if (n >= 100) {
      const hundreds = Math.floor(n / 100);
      result += units[hundreds] + ' শত ';
      n %= 100;
    }

    if (n >= 20) {
      const t = Math.floor(n / 10);
      const u = n % 10;
      if (t === 2 && u === 1) result += 'একুশ';
      else if (t === 2 && u === 2) result += 'বাইশ';
      else if (t === 2 && u === 3) result += 'তেইশ';
      else if (t === 2 && u === 4) result += 'চব্বিশ';
      else if (t === 2 && u === 5) result += 'পঁচিশ';
      else if (t === 2 && u === 6) result += 'ছাব্বিশ';
      else if (t === 2 && u === 7) result += 'সাতাশ';
      else if (t === 2 && u === 8) result += 'আটাশ';
      else if (t === 2 && u === 9) result += 'উনত্রিশ';
      else if (t === 3 && u === 1) result += 'একত্রিশ';
      else if (t === 3 && u === 2) result += 'বত্রিশ';
      else if (t === 3 && u === 3) result += 'তেত্রিশ';
      else if (t === 3 && u === 4) result += 'চৌত্রিশ';
      else if (t === 3 && u === 5) result += 'পঁয়ত্রিশ';
      else if (t === 3 && u === 6) result += 'ছত্রিশ';
      else if (t === 3 && u === 7) result += 'সাইত্রিশ';
      else if (t === 3 && u === 8) result += 'আটত্রিশ';
      else if (t === 3 && u === 9) result += 'ঊনচল্লিশ';
      else if (t === 4 && u === 1) result += 'একচল্লিশ';
      else if (t === 4 && u === 2) result += 'বিয়াল্লিশ';
      else if (t === 4 && u === 3) result += 'তেতাল্লিশ';
      else if (t === 4 && u === 4) result += 'চৌয়াল্লিশ';
      else if (t === 4 && u === 5) result += 'পঁয়তাল্লিশ';
      else if (t === 4 && u === 6) result += 'ছেচল্লিশ';
      else if (t === 4 && u === 7) result += 'সাতচল্লিশ';
      else if (t === 4 && u === 8) result += 'আটচল্লিশ';
      else if (t === 4 && u === 9) result += 'ঊনপঞ্চাশ';
      else if (t === 5 && u === 1) result += 'একান্ন';
      else if (t === 5 && u === 2) result += 'বায়ান্ন';
      else if (t === 5 && u === 3) result += 'তিপ্পান্ন';
      else if (t === 5 && u === 4) result += 'চুয়ান্ন';
      else if (t === 5 && u === 5) result += 'পঞ্চান্ন';
      else if (t === 5 && u === 6) result += 'ছাপ্পান্ন';
      else if (t === 5 && u === 7) result += 'সাতান্ন';
      else if (t === 5 && u === 8) result += 'আটান্ন';
      else if (t === 5 && u === 9) result += 'ঊনষাট';
      else if (t === 6 && u === 1) result += 'একষট্টি';
      else if (t === 6 && u === 2) result += 'বাষট্টি';
      else if (t === 6 && u === 3) result += 'তেষট্টি';
      else if (t === 6 && u === 4) result += 'চৌষট্টি';
      else if (t === 6 && u === 5) result += 'পঁয়ষট্টি';
      else if (t === 6 && u === 6) result += 'ছেষট্টি';
      else if (t === 6 && u === 7) result += 'সাতষট্টি';
      else if (t === 6 && u === 8) result += 'আটষট্টি';
      else if (t === 6 && u === 9) result += 'ঊনসত্তর';
      else if (t === 7 && u === 1) result += 'একাত্তর';
      else if (t === 7 && u === 2) result += 'বাহাত্তর';
      else if (t === 7 && u === 3) result += 'তিহাত্তর';
      else if (t === 7 && u === 4) result += 'চুয়াত্তর';
      else if (t === 7 && u === 5) result += 'পঁচাত্তর';
      else if (t === 7 && u === 6) result += 'ছিয়াত্তর';
      else if (t === 7 && u === 7) result += 'সাতাত্তর';
      else if (t === 7 && u === 8) result += 'আঠাত্তর';
      else if (t === 7 && u === 9) result += 'ঊনআশি';
      else if (t === 8 && u === 1) result += 'একাশি';
      else if (t === 8 && u === 2) result += 'বিয়াশি';
      else if (t === 8 && u === 3) result += 'তিরাশি';
      else if (t === 8 && u === 4) result += 'চৌরাশি';
      else if (t === 8 && u === 5) result += 'পঁচাশি';
      else if (t === 8 && u === 6) result += 'ছিয়াশি';
      else if (t === 8 && u === 7) result += 'সাতাশি';
      else if (t === 8 && u === 8) result += 'আটাশি';
      else if (t === 8 && u === 9) result += 'ঊননব্বই';
      else if (t === 9 && u === 1) result += 'একানব্বই';
      else if (t === 9 && u === 2) result += 'বিয়ানব্বই';
      else if (t === 9 && u === 3) result += 'তিরানব্বই';
      else if (t === 9 && u === 4) result += 'চৌরানব্বই';
      else if (t === 9 && u === 5) result += 'পঁচানব্বই';
      else if (t === 9 && u === 6) result += 'ছিয়ানব্বই';
      else if (t === 9 && u === 7) result += 'সাতানব্বই';
      else if (t === 9 && u === 8) result += 'আটানব্বই';
      else if (t === 9 && u === 9) result += 'নিরানব্বই';
      else {
        result += tens[t] + (u > 0 ? ' ' + units[u] : '');
      }
    } else if (n >= 10) {
      result += teens[n - 10];
    } else if (n > 0) {
      result += units[n];
    }

    return result.trim();
  }

  let words = '';
  let remaining = Math.floor(amount);

  if (remaining >= 10000000) { // Crore (কোটি)
    const crore = Math.floor(remaining / 10000000);
    words += convertLessThanThousand(crore) + ' কোটি ';
    remaining %= 10000000;
  }

  if (remaining >= 100000) { // Lakh (লক্ষ)
    const lakh = Math.floor(remaining / 100000);
    if (lakh > 0) {
      words += convertLessThanThousand(lakh) + ' লক্ষ ';
    }
    remaining %= 100000;
  }

  if (remaining >= 1000) { // Thousand (হাজার)
    const thousand = Math.floor(remaining / 1000);
    if (thousand > 0) {
      words += convertLessThanThousand(thousand) + ' হাজার ';
    }
    remaining %= 1000;
  }

  if (remaining > 0) {
    words += convertLessThanThousand(remaining);
  }

  return words.trim() + ' টাকা মাত্র';
}

/**
 * Convert number to English words
 */
export function numberToEnglishWords(amount: number): string {
  if (amount === 0) return 'Zero Taka Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertLessThanThousand(n: number): string {
    let result = '';
    if (n >= 100) {
      result += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + (n % 10 > 0 ? ' ' + units[n % 10] : '');
    } else if (n > 0) {
      result += units[n];
    }
    return result.trim();
  }

  let words = '';
  let remaining = Math.floor(amount);

  if (remaining >= 10000000) { // Crore (10 Million)
    const crore = Math.floor(remaining / 10000000);
    words += convertLessThanThousand(crore) + ' Crore ';
    remaining %= 10000000;
  }

  if (remaining >= 100000) { // Lakh (100 Thousand)
    const lakh = Math.floor(remaining / 100000);
    if (lakh > 0) {
      words += convertLessThanThousand(lakh) + ' Lakh ';
    }
    remaining %= 100000;
  }

  if (remaining >= 1000) {
    const thousand = Math.floor(remaining / 1000);
    if (thousand > 0) {
      words += convertLessThanThousand(thousand) + ' Thousand ';
    }
    remaining %= 1000;
  }

  if (remaining > 0) {
    words += convertLessThanThousand(remaining);
  }

  return words.trim() + ' Taka Only';
}

/**
 * Generate a random receipt number
 */
export function generateReceiptNo(): string {
  return 'REC-' + Math.floor(1000 + Math.random() * 9000);
}

/**
 * Generate a random Customer Business ID (e.g., AR-104)
 */
export function generateCustomerId(existing: string[]): string {
  let seq = 101 + existing.length;
  let id = `AR-${seq}`;
  while (existing.includes(id)) {
    seq++;
    id = `AR-${seq}`;
  }
  return id;
}

/**
 * Utility to export data lists as Excel compatible CSV with UTF-8 BOM
 */
export function exportToCSV(headers: string[], rows: (string | number)[][], fileName: string): void {
  const csvContent = "\uFEFF" + [
    headers.join(","),
    ...rows.map(row => 
      row.map(val => {
        const clean = (val === null || val === undefined) ? '' : String(val).replace(/"/g, '""');
        return clean.includes(',') || clean.includes('\n') || clean.includes('"') ? `"${clean}"` : clean;
      }).join(",")
    )
  ].join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
