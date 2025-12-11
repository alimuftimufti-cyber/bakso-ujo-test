
import React, { useEffect, useCallback } from 'react';
import { formatOrderForThermalPrinter } from '../services/receiptFormatter';
import type { Order, StoreProfile } from '../types';

interface PrintManagerProps {
    printerDevice: BluetoothDevice | USBDevice | null;
    setPrinterDevice: (device: BluetoothDevice | USBDevice | null) => void;
    orderToPrint: Order | null;
    clearOrderToPrint: () => void;
    storeProfile: StoreProfile;
}

const PrintManager: React.FC<PrintManagerProps> = ({ 
    printerDevice, 
    setPrinterDevice, 
    orderToPrint, 
    clearOrderToPrint, 
    storeProfile 
}) => {
    const encoder = new TextEncoder();

    const writeToPrinter = useCallback(async (data: string) => {
        if (!printerDevice) {
            console.error('No printer selected.');
            alert('Tidak ada printer dipilih.');
            return;
        }

        const encodedData = encoder.encode(data);

        // --- USB PRINTING LOGIC (ON-DEMAND CONNECTION) ---
        if ('transferOut' in printerDevice) {
            const usbDevice = printerDevice;
            let anInterfaceNumber: number | null = null;
            
            try {
                console.log("Opening device for printing...");
                await usbDevice.open();
                
                // Some devices require reset, some don't. It's safer to try.
                try { await usbDevice.reset(); } catch (e) { console.warn("Could not reset device, continuing...", e); }

                if (usbDevice.configuration === null) {
                    console.log("Selecting configuration 1...");
                    await usbDevice.selectConfiguration(1);
                }

                const anInterface = usbDevice.configuration?.interfaces[0];
                if (!anInterface) throw new Error("Interface USB tidak ditemukan.");
                anInterfaceNumber = anInterface.interfaceNumber;

                console.log(`Claiming interface ${anInterfaceNumber}...`);
                await usbDevice.claimInterface(anInterfaceNumber);

                const endpoint = anInterface.alternate.endpoints.find(e => e.direction === 'out');
                if (!endpoint) throw new Error("Endpoint USB output tidak ditemukan.");

                console.log("Sending data to printer...");
                await usbDevice.transferOut(endpoint.endpointNumber, encodedData);
                console.log('Data sent successfully.');

            } catch (error: any) {
                console.error('Failed to print via USB:', error);
                if (error.name === 'SecurityError' || error.message.includes('Access denied')) {
                     alert(`Gagal mencetak: Akses ke printer ditolak. Pastikan tidak ada program lain (misalnya driver printer) yang menggunakan perangkat ini.`);
                } else {
                     alert(`Gagal mencetak: ${error.message}.`);
                }
            } finally {
                // CRITICAL: Always release and close to prevent locking the device.
                if (usbDevice.opened) {
                    try {
                        if (anInterfaceNumber !== null) {
                            console.log(`Releasing interface ${anInterfaceNumber}...`);
                            await usbDevice.releaseInterface(anInterfaceNumber);
                        }
                    } catch(e) {
                        console.error("Failed to release interface:", e);
                    } finally {
                        console.log("Closing device connection...");
                        await usbDevice.close();
                    }
                }
            }

        // --- BLUETOOTH PRINTING LOGIC ---
        } else if ('gatt' in printerDevice) {
            const btDevice = printerDevice as BluetoothDevice;
            try {
                if (!btDevice.gatt?.connected) {
                    console.log("Reconnecting to Bluetooth printer...");
                    await btDevice.gatt?.connect();
                }
                
                const server = btDevice.gatt;
                // Standard Serial Port Service UUID
                const service = await server?.getPrimaryService('00001101-0000-1000-8000-00805f9b34fb');
                if (!service) throw new Error("Bluetooth service not found.");

                const characteristic = await service.getCharacteristic('00001101-0000-1000-8000-00805f9b34fb');
                if (!characteristic) throw new Error("Bluetooth characteristic not found.");

                const chunkSize = 50; // Max chunk size for many BT thermal printers
                for (let i = 0; i < encodedData.length; i += chunkSize) {
                    const chunk = encodedData.slice(i, i + chunkSize);
                    await characteristic.writeValueWithoutResponse(chunk);
                }
                console.log('Data sent to Bluetooth printer.');

            } catch (error: any) {
                console.error('Failed to print via Bluetooth:', error);
                alert(`Gagal mencetak via Bluetooth: ${error.message}`);
            }
        }
    }, [printerDevice, encoder]);


    useEffect(() => {
        const print = async () => {
            if (orderToPrint && printerDevice) {
                console.log('Printing order via device:', orderToPrint.id);
                const receiptData = formatOrderForThermalPrinter(orderToPrint, storeProfile);
                await writeToPrinter(receiptData);
                clearOrderToPrint();
            }
        };
        print();
    }, [orderToPrint, printerDevice, storeProfile, writeToPrinter, clearOrderToPrint]);


    return null; // This is a non-visual component
};

// --- Connection functions are now simpler, only for device selection ---

export const connectToBluetoothPrinter = async (): Promise<BluetoothDevice> => {
    if(!navigator.bluetooth) throw new Error('Web Bluetooth API tidak didukung di browser ini.');
    
    const device = await navigator.bluetooth.requestDevice({
       acceptAllDevices: true,
       optionalServices: ['00001101-0000-1000-8000-00805f9b34fb'] // Standard Serial Port Service
    });

    if (device) {
        return device;
    }
    throw new Error("No device selected.");
};

export const connectToUsbPrinter = async (): Promise<USBDevice> => {
    if (!navigator.usb) throw new Error('Web USB API tidak didukung di browser ini.');

    // Just request the device, DON'T open or claim it here.
    const device = await navigator.usb.requestDevice({
        filters: [{ classCode: 0x07 }] // Printer class code
    });

    if (device) {
        return device;
    }
    throw new Error("No device selected.");
};


export default PrintManager;
