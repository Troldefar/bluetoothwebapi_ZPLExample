/**
 * Custom bluetooth object for device interaction
 */

import ToastManager from './toastmanager.js';
import Zebra from './zebra.js';

class CustomBluetooth {

    NEW_LINE = '\n';
    EMPTY_STRING = '';

    getDevicesIsNotEnabled = 'Bluetooth.getDevices is not supported/enabled in this browser';

    constructor(cars) {
        this.cars = cars;

        this.zebra = new Zebra();
        this.toast = new ToastManager();

        this.options = { 
            filters: [{namePrefix: this.zebra.namePrefix}],
            services: [this.zebra.serviceUUID],
            optionalServices: [this.zebra.serviceUUID]
        };
    }

    async deligate(write = false) {

        /**
         * @function navigator.bluetooth.getDevices
         * chrome://flags/ -> bluetooth -> Use the new permissions backend for Web Bluetooth = enabled
         */
        
        if (!navigator.bluetooth.getDevices) return this.toast.send(this.getDevicesIsNotEnabled, 'ERROR_CLASS');

        const devices = await navigator.bluetooth.getDevices();
        if (devices.length === 0) return this.getDevice();

        for (const device of devices) {
            try {
                await device.watchAdvertisements();

                if (write) {
                    this.getDevice(device);
                    this.toast.send('Printing');
                }
                
                device.addEventListener('advertisementreceived', event => {
                    if (write) this.getDevice(device);
                });
            } catch (error) {
                if (write) this.toast.send(`Failed to watch advertisements (${error.message}) for ${device.name || 'Unnamed device'}:`, 'ERROR_CLASS');
            }
        }
    }

    async directCMD(message) {
        if (!navigator.bluetooth.getDevices) return this.toast.send(this.getDevicesIsNotEnabled, 'ERROR_CLASS');

        const devices = await navigator.bluetooth.getDevices();

        if (devices.length === 0) return this.toast.send('You are not connected to any devices', 'ERROR_CLASS');

        devices.map(async device => {
            try {
                const server = await device.gatt.connect();
                const service = await server.getPrimaryService(this.zebra.serviceUUID);
                this.characteristic = await service.getCharacteristic(this.zebra.characteristicUUID);
                await this.characteristic.writeValue(new TextEncoder().encode(message));
                this.toast.send(message);
            } catch(e) {
                this.toast.send(e, 'ERROR_CLASS');
            }
        });
    }

    async setBondingMode() {
        await this.directCMD(this.zebra.setBondingMode); 
    }

    async reset() {
        await this.directCMD(this.zebra.reset);
    }

    async discoverable() {
        await this.directCMD(this.zebra.discoverableOn);
    }

    async minimumsecuritymode() {
        await this.directCMD(this.zebra.minimumSecurityMode);
    }

    async ping() {
        await this.directCMD(this.zebra.ping); 
    }

    async resetBuffer() {
        await this.directCMD(this.zebra.resetBuffer);
    }

    async getDevice(device = null) {
        try {
            if (device === null) device = await navigator.bluetooth.requestDevice(this.options);
            const server = await device.gatt.connect();
            const service = await server.getPrimaryService(this.zebra.serviceUUID);
            this.characteristic = await service.getCharacteristic(this.zebra.characteristicUUID);

            this.talkToDevice();
        } catch(e) {
            
        }
    }

    async talkToDevice() {
        await this.write(this.zebra.header().replaceAll('\n', ''));
        for(let i = 0; i < this.cars.length; i++) await this.splitAndWrite(this.cars[i]);
    }

    async splitAndWrite(car) {
        const currentCmdArray = [];
        const splittedTokens = this.zebra.getZPLCommand(car).split(this.NEW_LINE);
        let validCmd = 0;
        for(let i = 0; i < splittedTokens.length; i++) {
            let currentStmt = splittedTokens[i].trim();
            let currentCmd = `cmd${validCmd}`;
            if (!currentCmdArray[currentCmd]) currentCmdArray[currentCmd] = this.EMPTY_STRING;
            
            currentCmdArray[currentCmd] += currentStmt;
            if (currentCmdArray[currentCmd].length >= this.zebra.ZEBRA_MAX_STRING_BUFFER_LENGTH) {
                currentCmdArray[currentCmd] = currentCmdArray[currentCmd].replace(currentStmt, this.EMPTY_STRING);
                currentCmdArray[`cmd${(validCmd+1)}`] = currentStmt;
                validCmd++;
            }
        }

        for(let obj in currentCmdArray) await this.write(currentCmdArray[obj]);
    }

    async write(cmd) {
        await this.characteristic.writeValue(new TextEncoder().encode(cmd));
    }

}

export default CustomBluetooth;
