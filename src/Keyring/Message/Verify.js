/**
 * import { NodeToast, Context } from "../_init.js";
 * { polkadotUtil, polkadotUtilCrypto } = window
 */


// Register Blackprint Node
Blackprint.registerNode("Polkadot.js/Keyring/Message/Verify",
class VerifyNode extends Blackprint.Node {
	// Input port
	static input = {
		Address: String, // base58
		Signature: Blackprint.Port.Union([String, Uint8Array]),
		Data: Blackprint.Port.Union([String, Uint8Array]),
	};

	// Output port
	static output = {
		IsValid: Boolean
	};

	constructor(instance){
		super(instance);

		let iface = this.setInterface(); // use empty interface
		iface.title = "Verify";
		iface.description = "Verify signed message";

		this._toast = new NodeToast(this.iface);

		// Manually call 'update' when any cable from input port was disconnected
		this.iface.on('cable.disconnect', Context.EventSlot, ({ port })=> {
			if(port.source === 'input') this.update();
		});
	}

	// This will be called by the engine if the input port have a new value
	update(){
		let { Input, Output } = this.ref; // Shortcut

		// Clear the output data if required port was not connected or not having data
		if(Input.Data == null || Input.Address == null || Input.Signature == null){
			Output.Bytes = null; // Clear it on error
			return toast.warn("Waiting required data");
		}

		// If the Data was string, let's convert it to Uint8Array
		let msg = Input.Data;
		if(msg.constructor === String){
			if(msg.slice(0, 2) === '0x')
				msg = polkadotUtil.hexToU8a(msg);
			else msg = polkadotUtil.stringToU8a(msg);
		}

		// If the Signature was string, maybe it was a Hex, let's convert it to Uint8Array
		let sign = Input.Signature;
		if(sign.constructor === String){
			if(sign.slice(0, 2) === '0x')
				sign = polkadotUtil.hexToU8a(sign);
			else return toast.warn("Signature must be Hex or Uint8Array");
		}

		// Remove any node toast
		toast.clear();
		await polkadotUtilCrypto.cryptoWaitReady();

		// Convert... wait.. whatt!?? (ToDo: recheck)
		let address = polkadotUtilCrypto.decodeAddress(Input.Address);
		let hexPublicKey = polkadotUtil.u8aToHex(address);

		// Verify the message/data and the signature with the public key
		Output.IsValid = polkadotUtilCrypto.signatureVerify(msg, sign, hexPublicKey).isValid;
	}
});