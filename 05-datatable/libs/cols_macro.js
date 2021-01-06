// creates equal-width column headers with css class multicolhead for styling
// ...titles is a comma-separated list a values to determine number and contents of columns

remark.macros.col_header = function (...titles) {
  
  var num_items = titles.length;
  var width = Math.floor(100/num_items) - 2*0.5;
  
  var code =
'<center>'+
'<div class="multicolrow"' +
    'style="font-weight:bold; text-align:center; vertical-align: middle; display: flex;">';

  for(let i = 0; i < num_items; i++)
  code = 
    code +  
    '<div class="multicolhead wordwrap"'+
    'style="'+
    'float:left;'+
    //'align-items: stretch;'+
    'padding: 1% 0.25% 1% 0.25%;'+
    'font-size: 100%;' +
    'margin: 1% 0.25% 1% 0.25%;' + 
    'width: ' + width + '%;">' + 
    titles[i] + 
    '</div>';


 code = code + 
'</div>' +
'</center>';

return code;

};

// creates row of equal-width column list elements
// ...bodies is a comma-separated list a values to determine number and contents of columns

remark.macros.col_list = function (...bodies) {
  
  var num_items = bodies.length;
  var width = Math.floor(100/num_items) - 0.5;
  
  var code =
'<center>'+
'<div class="multicolrow" style="text-align:left;">' ;

  for(let i = 0; i<num_items; i++)
  code =
    code +
  '<div class="multicolcol" style="'+
  'float:left;'+
  'font-size: 100%;' +
  'margin: 0% 0.25% 0% 0.25%;' + 
  'width:' + width + '%;"> <li>' + 
  bodies[i] + 
  '</li> </div>';

code = code +
'</div>' +
'</center>';

return code;

};

// creates row of equal-width column contents
// ...bodies is a comma-separated list a values to determine number and contents of columns

remark.macros.col_row = function (...bodies) {
  
  var num_items = bodies.length;
  var width = Math.floor(100/num_items) - 0.5;
  
  var code =
'<center>'+
'<div class="multicolrow" style="text-align:left;">' ;

  for(let i = 0; i<bodies.length; i++)
  code =
    code +
  '<div class="multicolcol" style="'+
  'float:left;'+
  'font-size: 100%;' +
  'margin: 0% 0.25% 0% 0.25%;' + 
  'width:' + width + '%;">' + 
  bodies[i] + 
  '</div>';

code = code +
'</div>' +
'</center>';

return code;

};