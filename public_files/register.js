var date = new Date();
date = date.toISOString().split('T')[0];

var test = document.getElementById("date");
test.max = date;
