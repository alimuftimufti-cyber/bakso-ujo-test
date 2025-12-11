import type { Order, StoreProfile } from '../types';

const formatRupiah = (number: number) => {
    // A simple non-currency formatter for thermal printers
    return "Rp" + new Intl.NumberFormat('id-ID').format(number);
}
const formatDateTime = (timestamp: number) => new Date(timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });

// ESC/POS commands
const ESC = '\x1B';
const GS = '\x1D';

const command = {
  CTL_LF: '\n',
  CTL_INIT: ESC + '@',
  PAPER_FULL_CUT: GS + 'V' + '\x00',
  TXT_NORMAL: ESC + '!' + '\x00',
  TXT_2HEIGHT: ESC + '!' + '\x10',
  TXT_BOLD_ON: ESC + 'E' + '\x01',
  TXT_BOLD_OFF: ESC + 'E' + '\x00',
  TXT_ALIGN_LT: ESC + 'a' + '\x00',
  TXT_ALIGN_CT: ESC + 'a' + '\x01',
};


const LINE_WIDTH = 32; // Standard for 58mm thermal printers

function createLine(char = '-'): string {
    return ''.padStart(LINE_WIDTH, char) + command.CTL_LF;
}

function createRow(left: string, right: string): string {
    const spaces = LINE_WIDTH - left.length - right.length;
    return left + ' '.repeat(Math.max(0, spaces)) + right + command.CTL_LF;
}

function wrapText(text: string, maxWidth: number): string {
    const words = text.split(' ');
    let lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        if ((currentLine + ' ' + word).trim().length > maxWidth) {
            if (currentLine.length > 0) {
                lines.push(currentLine);
            }
            currentLine = word;
        } else {
            currentLine = currentLine ? currentLine + ' ' + word : word;
        }
    }
    if (currentLine) {
        lines.push(currentLine);
    }
    return lines.join(command.CTL_LF);
}


export const formatOrderForThermalPrinter = (order: Order, profile: StoreProfile): string => {
    let receipt = '';
    
    // Header
    receipt += command.CTL_INIT;
    receipt += command.TXT_ALIGN_CT;
    receipt += command.TXT_2HEIGHT;
    receipt += `${profile.name}` + command.CTL_LF;
    receipt += command.TXT_NORMAL;
    receipt += wrapText(profile.address, LINE_WIDTH) + command.CTL_LF;
    receipt += command.CTL_LF;
    
    receipt += command.TXT_ALIGN_LT;
    receipt += `Waktu: ${formatDateTime(order.completedAt || order.paidAt || Date.now())}` + command.CTL_LF;
    receipt += `No: #${order.sequentialId || order.id.slice(-6)} / Kasir: Admin` + command.CTL_LF;
    receipt += createLine();

    // Items
    order.items.forEach(item => {
        receipt += wrapText(`${item.quantity}x ${item.name}`, LINE_WIDTH) + command.CTL_LF;
        receipt += createRow(`  @${formatRupiah(item.price)}`, `${formatRupiah(item.price * item.quantity)}`);
        if (item.note) {
            receipt += `   Catatan: ${item.note}` + command.CTL_LF;
        }
    });

    receipt += createLine();

    // Totals
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    receipt += createRow('Subtotal', formatRupiah(subtotal));
    if (order.discount > 0) {
        receipt += createRow('Diskon', `-${formatRupiah(order.discount)}`);
    }
    
    receipt += command.CTL_LF;
    receipt += command.TXT_BOLD_ON;
    receipt += command.TXT_2HEIGHT;
    receipt += createRow('TOTAL', formatRupiah(order.total));
    receipt += command.TXT_NORMAL;
    receipt += command.TXT_BOLD_OFF;
    receipt += command.CTL_LF;

    receipt += createRow('Metode Bayar', `${(order.paymentMethod || '').toUpperCase()}`);
    
    // Footer
    receipt += command.TXT_ALIGN_CT;
    receipt += createLine();
    receipt += 'Terima Kasih!' + command.CTL_LF;
    receipt += 'Selamat Menikmati' + command.CTL_LF;
    
    receipt += command.CTL_LF;
    receipt += command.CTL_LF;
    receipt += command.CTL_LF;
    
    // Cut paper
    receipt += command.PAPER_FULL_CUT;

    return receipt;
};