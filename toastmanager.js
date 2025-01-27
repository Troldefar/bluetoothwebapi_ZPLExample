class ToastManager {

    send(message, type = 'SUCCESS_CLASS') {
        // hydrate DOM alerts however you want
    }

    getType(type) {
        return this.types()[type];
    }

    types () {
        // get types however you want
    }

}

export default ToastManager;
