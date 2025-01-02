/**
 * Custom bluetooth object for device interaction
 */

import Zebra from './zebra.js';

class CustomBluetooth {
    
    NEW_LINE = '\n';
    EMPTY_STRING = '';
    
    constructor(value) {
        this.value = value;
        this.zebra = new Zebra(!this.value  ? 'Default' : value);
        
        this.options = { 
            filters: [{
                /**
                * Name can be found by alert/log device.name 
                * const device = await navigator.bluetooth.requestDevice(this.options);
                */
                namePrefix: this.zebra.namePrefix
            }],
            services: [this.zebra.serviceUUID],
            optionalServices: [this.zebra.serviceUUID]
        };
    }

    async deligate() {
        try {
            let device = null;

            /**
             * Get method[getDevices] by:
             * chrome://flags/ -> bluetooth -> Use the new permissions backend for Web Bluetooth = enabled
             */

            if (navigator.bluetooth.getDevices) {
                const devices = await navigator.bluetooth.getDevices();
                device = devices.find(d => d.name.startsWith(this.zebra.namePrefix));
            }

            this.getDevice(device);
        } catch (e) {
            this.getDevice();
        }
    }

    async getDevice(device = null) {
        if (!device) device = await navigator.bluetooth.requestDevice(this.options);

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(this.zebra.serviceUUID);
        this.characteristic = await service.getCharacteristic(this.zebra.characteristicUUID);

        this.talkToDevice();
    }
    
    async talkToDevice() {
        for(let i = 0; i < this.value.length; i++) {
            const cmd = this.zebra.getZPLCommand(this.value[i]);
            cmd.length > this.zebra.ZEBRA_MAX_STRING_BUFFER_LENGTH ? await this.splitAndWrite(this.value[i]) : await this.write(cmd);
        }
    }

    async splitAndWrite() {
        const currentCmdArray = [];
        const splittedTokens = this.getZPLCommand().split(this.NEW_LINE);
        
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
