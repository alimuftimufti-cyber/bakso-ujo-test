
import { formatOrderForThermalPrinter } from './receiptFormatter';
import type { Order, StoreProfile } from '../types';

// --- Device Selection ---

export const selectBluetoothPrinter = async (): Promise<BluetoothDevice> => {
    if(!navigator.bluetooth) throw new Error('Web Bluetooth API tidak didukung di browser ini.');
    
    const device = await navigator.bluetooth.requestDevice({
       acceptAllDevices: true,
       optionalServices: ['00001101-0000-1000-8000-00805f9b34fb'] // Standard Serial Port Service
    });

    if (!device) throw new Error("Tidak ada perangkat dipilih.");
    return device;
};

export const selectUsbPrinter = async (): Promise<USBDevice> => {
    if (!navigator.usb) throw new Error('Web USB API tidak didukung di browser ini.');

    // Just request the device, DON'T open or claim it here.
    const device = await navigator.usb.requestDevice({
        filters: [{ classCode: 0x07 }] // Printer class code
    });

    if (!device) throw new Error("Tidak ada perangkat dipilih.");
    return device;
};


// --- Printing Logic (On-Demand Connection) ---

const printViaUsb = async (device: USBDevice, data: string) => {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    let anInterfaceNumber: number | null = null;

    try {
        await device.open();
        // REMOVED: device.reset() call as it can cause conflicts on some devices.
        if (device.configuration === null) {
            await device.selectConfiguration(1);
        }
        const anInterface = device.configuration?.interfaces[0];
        if (!anInterface) throw new Error("Interface USB tidak ditemukan.");
        anInterfaceNumber = anInterface.interfaceNumber;

        await device.claimInterface(anInterfaceNumber);
        
        const endpoint = anInterface.alternate.endpoints.find(e => e.direction === 'out');
        if (!endpoint) throw new Error("Endpoint USB output tidak ditemukan.");
        
        await device.transferOut(endpoint.endpointNumber, encodedData);
        
    } finally {
        // CRITICAL: Always release and close to prevent locking the device.
        if (device.opened) {
            try {
                if (anInterfaceNumber !== null) {
                    await device.releaseInterface(anInterfaceNumber);
                }
            } catch(e) {
                console.error("Failed to release interface:", e);
            } finally {
                await device.close();
            }
        }
    }
};

const printViaBluetooth = async (device: BluetoothDevice, data: string) => {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    
    if (!device.gatt) throw new Error("GATT server not available.");

    if (!device.gatt.connected) {
        await device.gatt.connect();
    }
    
    const server = device.gatt;
    const service = await server?.getPrimaryService('00001101-0000-1000-8000-00805f9b34fb');
    if (!service) throw new Error("Bluetooth service not found.");

    const characteristic = await service.getCharacteristic('00001101-0000-1000-8000-00805f9b34fb');
    if (!characteristic) throw new Error("Bluetooth characteristic not found.");

    const chunkSize = 100; // Increased chunk size for better performance
    for (let i = 0; i < encodedData.length; i += chunkSize) {
        const chunk = encodedData.slice(i, i + chunkSize);
        await characteristic.writeValueWithoutResponse(chunk);
    }
};

export const printOrder = async (device: USBDevice | BluetoothDevice, order: Order, profile: StoreProfile) => {
    const receiptData = formatOrderForThermalPrinter(order, profile);
    
    try {
        if ('transferOut' in device) { // USB
            await printViaUsb(device, receiptData);
        } else if ('gatt' in device) { // Bluetooth
            await printViaBluetooth(device, receiptData);
        }
    } catch (error: any) {
        console.error("Print failed:", error);
         if (error.name === 'SecurityError' || error.message.includes('Access denied')) {
             throw new Error(`Akses ke printer ditolak oleh sistem. Ini adalah masalah umum jika driver pabrikan printer terpasang. Coba nonaktifkan driver tersebut, atau (untuk pengguna ahli) gunakan utilitas Zadig untuk menggantinya dengan driver WinUSB generik.`);
        }
        throw error; // Re-throw other errors
    }
}