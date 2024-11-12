/**
 * Custom bluetooth object for device interaction
 */

class CustomBluetooth {
    constructor(value) {
        this.ZEBRA_MAX_STRING_BUFFER_LENGTH = 500;
        this.ZEBRA_DEFAULT_LABEL_LENGTH = 200;
        this.NEW_LINE = '\n';
        this.EMPTY_STRING = '';

        this.customValue = value === this.EMPTY_STRING ? 'Default' : value;
        this.serviceUUID = 'your-service-uuid';
        this.characteristicUUID = 'your-characteristic-uuid';
        this.calculatedLabelLength = this.calculateLabelLength();
        this.options = { 
            acceptAllDevices: false,
            filters: [{
                namePrefix: 'XXXXXX' // Name can be found by alert/log device.name ( const device  = await navigator.bluetooth.requestDevice(this.options); )
            }],
            services: [this.serviceUUID],
            optionalServices: [this.serviceUUID]
        };
    }

    /**
     * Calculate the appropiate label length (Physical paper length based on input + buffer for sligthly better overview)
     * @returns int
     */

    calculateLabelLength() {
        return this.getZPLCommand().length + this.ZEBRA_DEFAULT_LABEL_LENGTH;
    }

    /**
     * Dummy getter for POC
     * Fetch the command any way you find correct
     * @exampleString generated by: https://labelary.com/viewer.html 
     * @returns string
     */

    getZPLCommand() {
        return `
        ^XA

        ^LT40
        ^FX Top section with logo, name and address.
        ^CF0,60
        ^FO50,50^GB100,100,100^FS
        ^FO75,75^FR^GB100,100,100^FS
        ^FO93,93^GB40,40,40^FS
        ^FO220,50^FD${this.customValue}, Inc.^FS
        ^CF0,30

        ^FO220,115^FD1000 Shipping Lane^FS
        ^FO220,155^FDShelbyville TN 38102^FS
        ^FO220,195^FDUnited States (USA)^FS
        ^FO50,250^GB700,3,3^FS

        ^FX Second section with recipient address and permit information.
        ^CFA,30
        ^FO50,300^FDJohn Doe^FS
        ^FO50,340^FD100 Main Street^FS
        ^FO50,380^FDSpringfield TN 39021^FS
        ^FO50,420^FDUnited States (USA)^FS
        ^CFA,15
        ^FO600,300^GB150,150,3^FS
        ^FO638,340^FDPermit^FS
        ^FO638,390^FD123456^FS
        ^FO50,500^GB700,3,3^FS

        ^FX Third section with bar code.
        ^BY5,2,270
        ^FO100,550^BC^FD12345678^FS

        ^FX Fourth section (the two boxes on the bottom).
        ^FO50,900^GB700,250,3^FS
        ^FO400,900^GB3,250,3^FS
        ^CF0,40
        ^FO100,960^FDCtr. X34B-1^FS
        ^FO100,1010^FDREF1 F00B47^FS
        ^FO100,1060^FDREF2 BL4H8^FS
        ^CF0,190
        ^FO470,955^FDCA^FS

        ^XZ
        `;
    }

    async connectAndDeligate() {
        try {
            const device  = await navigator.bluetooth.requestDevice(this.options);
            const server  = await device.gatt.connect();
            const service = await server.getPrimaryService(this.serviceUUID);
            this.characteristic = await service.getCharacteristic(this.characteristicUUID);
            this.getZPLCommand().length > this.ZEBRA_MAX_STRING_BUFFER_LENGTH ? this.splitAndWrite() : this.write(this.getZPLCommand());
        } catch (error) {
            alert(error);
        }
    }

    async splitAndWrite() {
        try {
            const currentCmdArray = [];
            const splittedTokens = this.getZPLCommand().split(this.NEW_LINE);
            let validCmd = 0;
            for(let i = 0; i < splittedTokens.length; i++) {
                let currentStmt = splittedTokens[i].replaceAll(' ', this.EMPTY_STRING);
                let currentCmd = `cmd${validCmd}`;
                if (!currentCmdArray[currentCmd]) currentCmdArray[currentCmd] = this.EMPTY_STRING;
                currentCmdArray[currentCmd] += currentStmt;
                if (currentCmdArray[currentCmd].length >= this.ZEBRA_MAX_STRING_BUFFER_LENGTH) {
                    currentCmdArray[currentCmd] = currentCmdArray[currentCmd].replace(currentStmt, this.EMPTY_STRING);
                    currentCmdArray[`cmd${(validCmd+1)}`] = currentStmt;
                    validCmd++;
                }
            }
            for(let obj in currentCmdArray) await this.write(currentCmdArray[obj]);
        } catch (e) {
            alert(e);
        }
    }

    async write(cmd) {
        await this.characteristic.writeValue(new TextEncoder().encode(cmd));
    }
}

export default CustomBluetooth;
