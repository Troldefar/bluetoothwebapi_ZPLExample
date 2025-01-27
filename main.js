import CustomBluetooth from './bluetooth.js';

document.addEventListener('DOMContentLoaded', function() {

    document.querySelector('button').addEventListener('click', async function(e) {
        e.preventDefault();

        // whatever values u need
        const cars = [
            {
                '1': '2'
            }
        ];
        
        const bluetoothConnection = new CustomBluetooth(cars);
        await bluetoothConnection.deligate();
    });
    
});
