function d2h(d) {
	return d.toString(16);
}
function h2d(h) {
	return parseInt(h, 16);
}
function stringToHex(tmp) {
	var tmp_len = tmp.length;

	var str = '';
	var c;

	for (var i = 0; i < tmp_len; i += 1) {
		c = tmp.charCodeAt(i);
		str += d2h(c) + ' ';
	}
	return str;
}

function hexToString(tmp) {
	var arr = tmp.split(' ');
	var len = arr.length;

	var str = '';
	var c;

	for (var i = 0; i < len; i += 1) {
		c = String.fromCharCode(h2d(arr[i]));
		str += c;
	}
	return str;
}

function printAge(month, day, year) {
	// In JS, month is 0 based, so adjust it on the way in
	var start = new Date(month - 1 + "/" + day + "/" + year);
	var today = new Date();
	var years = today.getFullYear() - start.getFullYear();

	if (today.getMonth() < start.getMonth()) {
		years--;
	}

	document.write(years);
}

function printEmail(prompt) {
	var email = hexToString("73 63 6f 74 74 40 6b 75 72 74 7a 65 62 6f 72 6e 2e 63 6f 6d");
	if (prompt == null)
		prompt = email;
	document.write("<a href='mailto:" + email + "'>" + prompt + "</a>");
}