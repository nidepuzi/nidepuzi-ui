goog.provide('purchase');

goog.require('goog.dom');
goog.require('goog.ui.Dialog');
goog.require('goog.ui.Zippy');
goog.require('goog.style');
goog.require('goog.ui.Component.EventType');

goog.require('goog.net.XhrIo');
goog.require('goog.uri.utils');

var MONEY_FIXED = 4;

function restoreRow ( oTable, nRow )
{
	var aData = oTable.fnGetData(nRow);
	var jqTds = $('>td', nRow);
	
	for ( var i=0, iLen=jqTds.length ; i<iLen ; i++ ) {
		oTable.fnUpdate( aData[i], nRow, i, false );
	}
	
	oTable.fnDraw();
}

/**修改一条datatable记录*/
function editRow ( oTable, nRow )
{
	var aData = oTable.fnGetData(nRow);
	var jqTds = $('>td', nRow);
	jqTds[5].innerHTML = '<input type="text" class="edit-price" value="'+aData[5]+'">';
	jqTds[6].innerHTML = '<input type="text" class="edit-num" value="'+aData[6]+'" >';
	jqTds[8].innerHTML = '<a class="save" href="#"><icon class="icon-ok"></icon></a>'
		+'<a class="delete" href="#"><icon class="icon-remove"></icon></a>';
}

/**保存一条datatable记录*/
function saveRow ( oTable, nRow )
{
	var jqInputs = $('input', nRow);
	oTable.fnUpdate( jqInputs[0].value, nRow, 5, false );
	oTable.fnUpdate( jqInputs[1].value, nRow, 6, false );
	oTable.fnUpdate( '<a class="edit" href="#"><icon class="icon-edit"></a>'+
		'<a class="delete" href="#"><icon class="icon-remove"></icon></a>', nRow, 8, false );
	oTable.fnDraw();
}

//添加商品搜索结果
var addSearchProdRow  = function(tableID,prod){

	var table = goog.dom.getElement(tableID);
	var rowCount = table.rows.length;
    var row   = table.insertRow(rowCount);
    var index = rowCount;
    
	var id_cell       = createDTText(index+'');
	var img_cell      = goog.dom.createElement('td');
	img_cell.innerHTML = '<img width="40" height="60" margin="0" src="'+prod[1]+'"></img>';
	
	var outer_id_cell = createDTText(prod[0]);
	var title_cell    = createDTText(prod[2]);
	
	var stock_cell    = createDTText(prod[4]);
	var created_cell    = createDTText(prod[5]);

	var addbtn_cell   = goog.dom.createElement('td');
	addbtn_cell.innerHTML = '<button class="select-purchase-items btn btn-mini btn-info" style="margin:1px 0;" prod_id="'+prod[0]+'">查看规格</button>';
	
	row.appendChild(id_cell);		
	row.appendChild(img_cell); 
	row.appendChild(outer_id_cell); 
	row.appendChild(title_cell);	 
	row.appendChild(stock_cell);		 
	row.appendChild(created_cell);	 
	row.appendChild(addbtn_cell);	 
}

//添加商品规格条目
var addPurchaseItemRow  = function(datatable,prod,sku){

    datatable.fnAddData( [  prod[0],
							prod[2], 
							sku[0], 
							sku[1], 
							'<input type="text" class="edit-price" value="0.0" />',
							'<input type="text" class="edit-num" value="0" />',
							'<button class="add-purchase-item btn btn-mini btn-info" style="margin:1px 0;" >添加</button>' 
							],true);
    
}


//采购项目选择对话框
purchase.PurchaseSelectDialog = function(manager){
	this.manager       = manager;
	this.promptDiv     = goog.dom.getElement('purchase-prompt');
	this.promptBody    = goog.dom.getElement('purchase-prompt-body');
	this.prod          = null;
	
	var closeBtn  = goog.dom.getElement('prompt-close');
	goog.events.listen(closeBtn, goog.events.EventType.CLICK,this.hide,false,this);
	
	this.select_table = $('#purchase-select-table').dataTable({
   		//"bJQueryUI": true,
		"bAutoWidth": false, //自适应宽度
		"aaSorting": [[1, "asc"]],
		"iDisplayLength": 20,
		"aLengthMenu": [[20, 50, 100, -1], [20, 50, 100, "All"]],
		//"sPaginationType": "full_numbers",
		//"sDom": '<"H"Tfr>t<"F"ip>',
		"oLanguage": {
			"sLengthMenu": "每页 _MENU_ 条",
			"sZeroRecords": "抱歉， 没有找到",
			"sInfo": "从 _START_ 到 _END_ /共 _TOTAL_ 条",
			"sInfoEmpty": "没有数据",
			"sSearch": "搜索",
			"sInfoFiltered": "(从 _MAX_ 条数据中检索)",
			"oPaginate": {
				"sFirst": "首页",
				"sPrevious": "前一页",
				"sNext": "后一页",
				"sLast": "尾页"
			},
			"sZeroRecords": "没有检索到数据",
			"sProcessing": "<img src='/static/img/loading.gif' />"
		}		
	});
}


purchase.PurchaseSelectDialog.prototype.init = function(prod){
	
	this.prod     = prod;
	var prod_sku  = prod[6];
	this.select_table.fnClearTable();
	
	for(var i=0;i<prod_sku.length;i++){
		addPurchaseItemRow(this.select_table,prod,prod_sku[i]);
	}
	
}


purchase.PurchaseSelectDialog.prototype.show = function(){
	var scrollHeight = $(document).scrollTop();
	var pos = goog.style.getPageOffset(this.manager.search_prod_table);
	goog.style.setPageOffset(this.promptDiv,pos.x,scrollHeight+pos.y);
	goog.style.setStyle(this.promptDiv, "display", "block");
}


purchase.PurchaseSelectDialog.prototype.hide = function(){
	goog.style.setStyle(this.promptDiv, "display", "none");
}


//主控制对象
goog.provide('purchase.Manager');
/** @constructor */
purchase.Manager = function () {

    this.proditems     = {};
    this.purchaseid_label   = goog.dom.getElement('id_purchase');
    this.prod_q        = goog.dom.getElement('id_prod_q');
	this.search_prod_table  = goog.dom.getElement('id-prod-search-table');
	this.checkBtn      = goog.dom.getElement('check_purchase');
	
	this.prompt_dialog = new purchase.PurchaseSelectDialog(this);
	this.datatable     = null;
	this.nEditing      = null;//datatable当前选定行
	this.bindEvent();
}


//商品搜索事件处理
purchase.Manager.prototype.onProdSearchKeyDown = function(e){
	
	var prod_qstr   = this.prod_q.value;
	var purchase_id = this.purchaseid_label.innerHTML;
	if (e.keyCode==13){
		if (purchase_id==null||purchase_id==''||purchase_id=='undifine'){
			alert('请先保存采购单基本信息');
			return;
		}
		this.showProduct(prod_qstr);	
	}
	return;
}


//添加采购项
purchase.Manager.prototype.onCreatePurchaseItem = function(row){
	
	$('#purchase-items').show();
	var params = {  'purchase_id':this.purchaseid_label.innerHTML,
					'outer_id':row.cells[0].innerHTML,
					'outer_sku_id':row.cells[2].innerHTML,
					'price':parseFloat(row.cells[4].firstChild.value),
					'num':row.cells[5].firstChild.value};
	var that = this;
	var callback = function(e){
		var xhr = e.target;
        try {
        	var res = xhr.getResponseJson();
        	if (res.code==0){
        		var purchase_item = res.response_content;
        		that.datatable.fnAddData( [ purchase_item.id,
									purchase_item.outer_id, 
									purchase_item.name, 
									purchase_item.outer_sku_id, 
									purchase_item.properties_name,
									purchase_item.price,
									purchase_item.purchase_num, 
									purchase_item.total_fee,
									'<a class="edit" href="#"><icon class="icon-edit"></icon></a>'+
									'<a class="delete" href="#"><icon class="icon-remove"></icon></a>'],true);
				goog.style.setStyle(row,'background-color','#BFCEEC');
				goog.style.showElement(row.cells[6].firstChild, false);
				that.calPurchaseNumAndFee();
        	}else{
        		alert("错误:"+res.response_error);
        	}
        } catch (err) {
            console.log('Error: (ajax callback) - ', err);
        } 
	};
	var content = goog.uri.utils.buildQueryDataFromMap(params);
	goog.net.XhrIo.send('/purchases/item/',callback,'POST',content);
}

//添加采购项
purchase.Manager.prototype.savePurchaseItem = function(nRow){
	
	var params = {  'purchase_id':this.purchaseid_label.innerHTML,
					'product_id':nRow.getAttribute('pid')?nRow.getAttribute('pid'):'',
					'sku_id':nRow.getAttribute('sid')?nRow.getAttribute('sid'):'',
					'outer_id':nRow.cells[1].innerHTML,
					'outer_sku_id':nRow.cells[3].innerHTML,
					'price':parseFloat(nRow.cells[5].firstChild.value),
					'num':nRow.cells[6].firstChild.value};
	var that = this;
	var callback = function(e){
		var xhr = e.target;
        try {
        	var res = xhr.getResponseJson();
        	if (res.code==0){
        		var purchase_item = res.response_content;
				that.datatable.fnUpdate( purchase_item.price, nRow, 5, false );
				that.datatable.fnUpdate( purchase_item.purchase_num, nRow, 6, false );
				that.datatable.fnUpdate( purchase_item.total_fee, nRow, 7, false );
				that.datatable.fnUpdate( '<a class="edit" href="#"><icon class="icon-edit"></a>'+
					'<a class="delete" href="#"><icon class="icon-remove"></icon></a>', nRow, 8, false );
				that.datatable.fnDraw();
        	}else{
        		alert("错误:"+res.response_error);
        	}
        } catch (err) {
            console.log('Error: (ajax callback) - ', err);
        } 
	};
	var content = goog.uri.utils.buildQueryDataFromMap(params);
	goog.net.XhrIo.send('/purchases/item/',callback,'POST',content);
}

//删除采购项
purchase.Manager.prototype.delPurchaseItem = function(nRow){
	
	var purchase_item_id = nRow.cells[0].innerHTML;
	if(!confirm("确定删除采购项目"+purchase_item_id+"吗？"))
	{
	    return;
	}
	var params = {  'purchase_id':this.purchaseid_label.innerHTML,
					'purchase_item_id':purchase_item_id};
	var that = this;
	var callback = function(e){
		var xhr = e.target;
        try {
        	var res = xhr.getResponseJson();
        	if (res.code==0){
      			that.datatable.fnDeleteRow( nRow );
        	}else{
        		alert("错误:"+res.response_error);
        	}
        } catch (err) {
            console.log('Error: (ajax callback) - ', err);
        } 
	};
	var content = goog.uri.utils.buildQueryDataFromMap(params);
	goog.net.XhrIo.send('/purchases/item/del/',callback,'POST',content);
}


//审核采购合同
purchase.Manager.prototype.onCheckPurchaseInfo = function(e){
	
	var purchase_id = this.purchaseid_label.innerHTML;
	
	if (purchase_id==''||purchase_id=='undifine'){
		alert('请先保存采购基本信息');
		return;
	}
	
	if(!confirm("请校对采购商品编码，规格，数量，金额无误后再确认？"))
	{
	    return;
	};
	
	var callback = function(e){
        var xhr = e.target;
        try {
        	var res = xhr.getResponseJson();
        	if (res.code==0){
        		location.reload();
        	}else{
        		alert('审核失败:'+res.response_error);
        	}
        } catch (err) {
            console.log('Error: (ajax callback) - ', err);
        } 
	}
	goog.net.XhrIo.send('/purchases/'+purchase_id+'/?format=json',callback,'POST');
	
}

//显示商品搜索记录
purchase.Manager.prototype.showProduct = function (q) {
	this.search_q = q;
    var that      = this;
    if (q==''||q=='undifine'){return;};
    if (q.length>40){alert('搜索字符串不能超过40字');return;};

    var callback = function(e){
        var xhr = e.target;
        try {
        	var res = xhr.getResponseJson();
        	if (res.code == 0){
        		clearTable(that.search_prod_table);
        
        		var prod_list = res.response_content;
            	for(var i=0;i<prod_list.length;i++){
            		that.proditems[prod_list[i][0]] = prod_list[i]
            		addSearchProdRow('id-prod-search-table',prod_list[i]);
            	}

            	var slt_ph_btns = goog.dom.getElementsByClass('select-purchase-items');
            	for(var i=0;i<slt_ph_btns.length;i++){
            		goog.events.listen(slt_ph_btns[i], goog.events.EventType.CLICK,that.onShowPurchaseItems,false,that);
            	}
            }else{
                alert("商品查询失败:"+res.response_error);
            }
        } catch (err) {
            console.log('Error: (ajax callback) - ', err);
        } 
	}
	goog.net.XhrIo.send('/items/query/?q='+q,callback);
}


//响应点击查看采购项事件
purchase.Manager.prototype.onShowPurchaseItems = function (e) {
	
	var target    = e.target;
	var prod_id   = target.getAttribute('prod_id');
	var prod      = this.proditems[prod_id];

	this.prompt_dialog.init(prod);
	this.prompt_dialog.show();
}


//添加退货商品
purchase.Manager.prototype.addRefundOrder = function (e) {

	var target = e.target;
	var idx    = target.getAttribute('idx');
	var outer_id     = target.getAttribute('outer_id');
	var outer_sku_id = target.getAttribute('outer_sku_id');
	
}


//显示交易订单列表信息
purchase.Manager.prototype.hidePromptDialog = function(){
	this.orderlist_dialog.hide();
	this.orderconfirm_dialog.hide();
}

//计算采购单数量及费用
purchase.Manager.prototype.calPurchaseNumAndFee = function(){
	var total_num = 0;
	var total_fee = 0.0;
	var cell_num  = 0;
	var cell_fee  = 0.0;
 	var row = null;
 	
	var rows = $("#purchaseitem-table > tbody > tr");
	for(var i=0;i < rows.length;i++){
		row = rows[i];
		if (row.cells.length < 8){continue;}
		
		cell_num = row.cells[6].innerHTML;
		cell_fee = row.cells[7].innerHTML;
		
		if(parseInt(cell_num)){
			total_num += parseInt(cell_num);
		}else{
			cell_num = $('input',row.cells[6]).val();
			if (parseInt(cell_num)){
				total_num += parseInt(cell_num);
			}
		}
		
		if(parseFloat(cell_fee)){
			total_fee += parseFloat(cell_fee);
		}else{
			cell_fee = $('input',row.cells[7]).val();
			if (parseInt(cell_fee)){
				total_fee += parseInt(cell_fee);
			}
		}
	}
	$('#total_num').val(total_num.toString());
	$('#total_fee').val(total_fee.toFixed(MONEY_FIXED).toString())
}

//绑定事件
purchase.Manager.prototype.bindEvent = function (){

	goog.events.listen(this.prod_q  , goog.events.EventType.KEYDOWN,this.onProdSearchKeyDown,false,this);
	
	goog.events.listen(this.checkBtn , goog.events.EventType.CLICK,this.onCheckPurchaseInfo,false,this);
	   
	$("#purchase-prompt").draggable({handle: $('#purchase-prompt-head')});
	
	 //对jquery的datatable表格进行初始化
	this.datatable = $('#purchaseitem-table').dataTable({
   		//"bJQueryUI": true,
		"bAutoWidth": false, //自适应宽度
		"aaSorting": [[1, "asc"]],
		"iDisplayLength": 20,
		"aLengthMenu": [[20, 50, 100, -1], [20, 50, 100, "All"]],
		//"sPaginationType": "full_numbers",
		//"sDom": '<"H"Tfr>t<"F"ip>',
		"oLanguage": {
			"sLengthMenu": "每页 _MENU_ 条",
			"sZeroRecords": "抱歉， 没有找到",
			"sInfo": "从 _START_ 到 _END_ /共 _TOTAL_ 条",
			"sInfoEmpty": "没有数据",
			"sSearch": "搜索",
			"sInfoFiltered": "(从 _MAX_ 条数据中检索)",
			"oPaginate": {
				"sFirst": "首页",
				"sPrevious": "前一页",
				"sNext": "后一页",
				"sLast": "尾页"
			},
			"sZeroRecords": "没有检索到数据",
			"sProcessing": "<img src='/static/img/loading.gif' />"
		}		
	});
	
	//数量，费用初始化
	this.calPurchaseNumAndFee();
	
	var that = this;
	//设置每页显示数量时，重新计算
	$("select[name='purchaseitem-table_length']").change(function(e){
		e.preventDefault();
		that.calPurchaseNumAndFee();
	});
	
	//搜索时，重新计算
	$("#purchaseitem-table_filter input").keyup(function(e){
		e.preventDefault();
		that.calPurchaseNumAndFee();
	});
	
	//分页时，重新计算
	$("#purchaseitem-table_paginate a").click(function(e){
		e.preventDefault();
		that.calPurchaseNumAndFee();
	});
	
	//绑定删除事件
	$('#purchaseitem-table a.delete').live('click', function (e) {
		e.preventDefault();
		var nRow = $(this).parents('tr')[0];
		that.delPurchaseItem(nRow);
		that.calPurchaseNumAndFee();
	});
	//绑定保存事件
	$('#purchaseitem-table a.save').live('click', function (e) {
		e.preventDefault();
		
		var nRow = $(this).parents('tr')[0];
		that.savePurchaseItem(nRow);
		that.nEditing = null;
		that.calPurchaseNumAndFee();
	} );
	//绑定编辑事件
	$('#purchaseitem-table a.edit').live('click', function (e) {
		e.preventDefault();
		var nRow = $(this).parents('tr')[0];
		if ( that.nEditing !== null && that.nEditing != nRow ) {

			restoreRow( that.datatable, that.nEditing );
			editRow( that.datatable, nRow );
			that.nEditing = nRow;
		}else {

			editRow( that.datatable, nRow );
			that.nEditing = nRow;
		}
	});
	
	//添加采购项
	$('#purchase-select-table .add-purchase-item').live('click',function (e){
		e.preventDefault();
		
		var row = e.target.parentElement.parentElement;
		that.onCreatePurchaseItem(row);
		
	});
	
	//绑定数量修改按键事件
	$('input.edit-num').live('keyup', function (e) {
		
		e.preventDefault();
		var target = e.target;
		var num = target.value;
		
		if (!parseInt(num)&&num!=''){
			target.value = '0';
		}
	} );
	//选择日期插件
	$("#service_date").datepicker({ dateFormat: "yy-mm-dd" });
	$("#forecast_date").datepicker({ dateFormat: "yy-mm-dd" });
}



