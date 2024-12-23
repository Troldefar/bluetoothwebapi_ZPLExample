<?php 
    if(!preg_match('/Chrome/', $_SERVER['HTTP_USER_AGENT'])) 
        exit(htmlspecialchars(('This feature is for the time being only available in the Google Chrome browser, sorry for the inconveince'))); 
?>

<p><?= htmlspecialchars('Print out information'); ?></p>
<input type="text" placeholder="<?= htmlspecialchars('Insert text'); ?>" id="generic" />
<button><?= htmlspecialchars('Print'); ?></button>

<script defer type="module">
    import CustomBluetooth from './bluetooth.js';
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelector('button').addEventListener('click', async function(e) {
            e.preventDefault();
            const bluetoothConnection = new CustomBluetooth(document.getElementById('generic').value);
            await bluetoothConnection.deligate();
        });
    });
</script>
