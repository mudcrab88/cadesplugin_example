
window.onload = function() {
    cadesplugin.then(() => {
        fillCertificateListAsync();
    }).catch((error) => {
        console.log(error);
    });
}

const SELECT_ID = 'certificate';

function fillCertificateListAsync() {
    cadesplugin.async_spawn(function*() {
        try {
            let oStore = yield cadesplugin.CreateObjectAsync('CAdESCOM.Store');
            yield oStore.Open(cadesplugin.CAPICOM_CURRENT_USER_STORE, cadesplugin.CAPICOM_MY_STORE, cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);
            let certs = yield oStore.Certificates;
            certs = yield certs.Find(cadesplugin.CAPICOM_CERTIFICATE_FIND_TIME_VALID);
            let certsCount = yield certs.Count;

            for (let i = 1; i <= certsCount; i++) {
                let cert = yield certs.Item(i);
                let certSubjectName = yield cert.SubjectName;
                let certOrganization = getRdnByOid(certSubjectName, 'CN');
				let certPublicKey = yield cert.PublicKey();
				let certAlgorithm = yield certPublicKey.Algorithm;
				let algorithm = yield certAlgorithm.FriendlyName;

				let certHasPrivateKey = yield cert.HasPrivateKey();
                let certIsValid = yield cert.IsValid();
				
				if (certHasPrivateKey && certIsValid.Result 
				&& (algorithm.indexOf('34.10-2001') > -1||algorithm.indexOf('34.10-2012') > -1)) {
					let certThumbprint = yield cert.Thumbprint;
					let certSerialNumber = yield cert.SerialNumber;
					let certCaption = certOrganization + '(' + certSerialNumber +')';
					addOptionToSelect(SELECT_ID, certCaption, certThumbprint);
				}
            }
            oStore.Close();
        } catch (exc) {
             console.log(exc);
        }
    });
};

function addOptionToSelect(selectId, caption, value) {
	let selectItem = document.getElementById(selectId);
	let opt = document.createElement('option');
    opt.value = value;
    opt.innerHTML = caption;
    selectItem.appendChild(opt);
}

function getRdnByOid(dn, oid){
    if(!dn.length)
        return null;

    //Ищем запись вида oid="rdn",(пробел) исключая наличие в rdn символов "",
    var regular = oid+'="([^"]*?)",';
    var result = dn.match(regular);
    if(result)
        return result[1];

    //Ищем запись вида oid="rdn" в конце строки, исключая наличие в rdn символов "",
    regular = oid+'="([^"]*?)"$';
    result = dn.match(regular);
    if(result)
        return result[1];

    //ищем запись вида oid=rdn, oid=...
    regular = oid+'=(.*?),';
    result = dn.match(regular);
    if(result)
        return result[1];

    //ищем запись вида oid=rdn (в конце строки)
    regular = oid+'=(.*?)$';
    result = dn.match(regular);
    if(result)
        return result[1];
    else
        return null;
}