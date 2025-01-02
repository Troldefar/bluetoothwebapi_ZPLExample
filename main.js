import CustomBluetooth from './bluetooth.js';

document.addEventListener('DOMContentLoaded', function() {

    document.querySelector('button').addEventListener('click', async function(e) {
        e.preventDefault();
        const bluetoothConnection = new CustomBluetooth(document.getElementById('generic').value);
        await bluetoothConnection.deligate();
    });
    
});