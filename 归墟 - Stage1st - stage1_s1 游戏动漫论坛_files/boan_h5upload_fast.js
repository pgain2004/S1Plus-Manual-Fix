

function BoanH5upload(){
	try{
		
	}catch(e){
	}
}

BoanH5upload.prototype.beforeFileQueued = function(prefix,file){
	var upObj = prefix ? imgUpload : upload;
	if(upObj.customSettings.uploadSource == 'forum') {
		upObj.customSettings.alertType = 0;
		if(upObj.customSettings.uploadFrom == 'fastpost') {
			if(typeof forum_post_inited == 'undefined') {
				appendscript(JSPATH + 'forum_post.js?' + VERHASH);
			}
		}
	}
	createQueue = true;
	if(upObj.customSettings.uploadSource == 'forum') {
		if(upObj.customSettings.maxAttachNum != undefined) {
			if(upObj.customSettings.maxAttachNum > 0) {
				upObj.customSettings.maxAttachNum--;
			} else {
				upObj.customSettings.alertType = 6;
				createQueue = false;
			}
		}

		if(createQueue && upObj.customSettings.maxSizePerDay != undefined) {
			if(upObj.customSettings.maxSizePerDay - file.size > 0) {
				upObj.customSettings.maxSizePerDay = upObj.customSettings.maxSizePerDay - file.size
			} else {
				upObj.customSettings.alertType = 11;
				createQueue = false;
			}
		}
		if(createQueue && upObj.customSettings.filterType != undefined) {
			var fileSize = upObj.customSettings.filterType[file.ext.substr(1).toLowerCase()];
			if(fileSize != undefined && fileSize && file.size > fileSize) {
				upObj.customSettings.alertType = 5;
				createQueue = false;
			}
		}
	}
	if(file.ext=='png'){
		file.type='image/jpeg'
		file.source.type='image/jpeg'
	}
	return createQueue;
	
}

BoanH5upload.prototype.fileQueued = function(prefix,file,Obj){
	var upObj = prefix ? imgUpload : upload;
	var progress = new FileProgress(file, upObj.customSettings.progressTarget);
	progress.setStatus(boan_h5upload_lang['wait_up']);
	
	progress.toggleCancel = function (show, swfUploadInstance) {
		this.fileProgressElement.childNodes[0].style.visibility = show ? "visible" : "hidden"; //设置是否显示取消按钮
		if (swfUploadInstance) {
			var fileID = this.fileProgressID;
			this.fileProgressElement.childNodes[0].onclick = function () {
				swfUploadInstance.removeFile(fileID);
				this.setCancelled();
				return false;
			};
		}
	};
	progress.toggleCancel(true,Obj);
	
	if(upObj.customSettings.uploadType == 'attach') {
		try {
			    $('attach_tblheader').style.display = '';
				$('attach_notice').style.display = '';
		} catch (ex) {}
	} else if(upObj.customSettings.uploadType == 'image') {
		try {
			$('imgattach_notice').style.display = '';
		} catch (ex) {}
	}
	var objId = upObj.customSettings.uploadType == 'attach' ? 'attachlist' : 'imgattachlist';
	var listObj = $(objId);
	var tableObj = listObj.getElementsByTagName("table");
	if(!tableObj.length) {
		listObj.innerHTML = "";
	}
}

BoanH5upload.prototype.uploadSuccess = function(prefix,file,response,Obj){
	
	try {
		var upObj = prefix ? imgUpload : upload;
		var progress = new FileProgress(file, upObj.customSettings.progressTarget);
		if(upObj.customSettings.uploadSource == 'forum') {
			aid = parseInt(response);
			if(aid > 0) {
				if(upObj.customSettings.uploadType == 'attach') {
					ajaxget('forum.php?mod=ajax&action=attachlist&aids=' + aid + (!fid ? '' : '&fid=' + fid)+(typeof resulttype == 'undefined' ? '' : '&result=simple'), file.id);
				} else if(upObj.customSettings.uploadType == 'image') {
					var tdObj = getInsertTdId(upObj.customSettings.imgBoxObj, 'image_td_'+aid);
					ajaxget('forum.php?mod=ajax&action=imagelist&type=single&pid=' + pid + '&aids=' + aid + (!fid ? '' : '&fid=' + fid), tdObj.id);
					$(file.id).style.display = 'none';
				}
			} else {
				aid = aid < -1 ? Math.abs(aid) : aid;
				if(typeof STATUSMSG[aid] == "string") {
					progress.setStatus(STATUSMSG[aid]);
					showDialog(STATUSMSG[aid], 'notice', null, null, 0, null, null, null, null, sdCloseTime);
				} else {
					progress.setStatus(boan_h5upload_lang['cancel_up']);
				}
				
				progress.setCancelled();
				Obj.removeFile(file.id);
				progress.toggleCancel(false);		
			}
		} else {
			progress.setComplete();
			progress.setStatus(boan_h5upload_lang['ok_up']);
			progress.toggleCancel(false);
		}
	} catch (ex) {
		alert(ex.message);
	}
}


BoanH5upload.prototype.get_signature =function(file,type){
	var obj = null;
	var url = 'plugin.php?id=boan_h5upload:ajax&oss=yes&type=forum&filename=';
	url += file.name;
	url += '&hash='+upload.settings['post_params']['hash'] + '&atttype=' + type + '&ext=' + file.ext;;
	boan_jq.ajax({
				type:"GET",
				url:url,
				async:false,
				success:function(data){
					if(data == -10 || data == 0){
						alert('up error');
					}else{
						 if(boan_h5upload_ossserver == 'tencent'){
							 obj = data;
						 }else{
							 data = data.substr(0,data.indexOf('}')+1);
							 obj = eval ("(" + data + ")");
						 }
					}
				},
				error:function(xhr,status,error){
					alert(error);
				},
	});
	return obj;
}


BoanH5upload.prototype.setH5 = function(){
	//设置附件上传
	var that = this;
	newnode = document.createElement('div');
	newnode.id = 'uploader';
    newnode.className = 'wu-example';
	newnode.innerHTML = '<div id="thelist" class="uploader-list"></div><div class="btns"><div id="picker" title="'
	+ boan_h5upload_lang['explain_fast'] + '">' 
	+ boan_h5upload_lang['attach'] + '</div></div>';
	
	rnode = $('spanButtonPlaceholder');
	rnode || (rnode = $('SWFUpload_0'));
	rnode.parentNode.replaceChild(newnode,rnode);
	
	if(boan_h5upload_ossserver && boan_h5upload_att_hlongup){
		upload_url = boan_h5upload_hlongurl;
		var fileVal = 'file'; //'Filedata'
			
	}else{
		upload_url = upload.settings['upload_url'];
		var fileVal = 'Filedata'; 
	}

	
	var uploader = WebUploader.create({
		server: upload_url,
		//server:'misc.php',
		formData:upload.settings['post_params'],
		pick:{id:'#picker'},
		fileVal:fileVal,
		swf:'source/plugin/boan_h5upload/image/Uploader.swf',
		paste: document.body,
		accept:{
			title:upload.settings['file_types_description'],
			extensions:upload.settings['file_types'].replace(/\*\./g,'').replace(/;/g,','),
		},
		compress:boan_h5upload_dispose,
		fileSingleSizeLimit:upload.settings['file_size_limit']*1024*5,
		resize: false,
	});
	
	function boan_addpost(file,key,val){
		    file.post || (file.post = new Array());
			
			file.post.push(key + '|' + val);
	}
	
	
	
	//附件上传
	uploader.on('beforeFileQueued',function(file){
		return boanH5upload.beforeFileQueued('',file);
	});
	
	
	uploader.on('error', function(err_num){
		var MSG = {
			F_EXCEED_SIZE : boan_h5upload_lang['Q_EXCEED_SIZE_LIMIT'],
			Q_TYPE_DENIED : boan_h5upload_lang['Q_TYPE_DENIED'],
			F_DUPLICATE	  : boan_h5upload_lang['F_DUPLICATE']
			
		};
		alert(MSG[err_num] ? MSG[err_num] : err_num);
	});
	
	uploader.on('fileQueued',function(file){
		boanH5upload.fileQueued('',file,this);
		this.upload();
	});
	
	uploader.on( 'uploadBeforeSend', function( object, data,header ) {
       // 修改data可以控制发送哪些携带数据。
      if(object.file.post){
		   for(var i = 0 ; i < object.file.post.length;i++){
			 var v = object.file.post[i].split('|');
			 eval('data.' + v[0] + '="' + v[1] + '"');
		   }
	  }
	  delete data.lastModifiedDate;
	  delete data.name;
  
		if(boan_h5upload_att_hlongup && boan_h5upload_ossserver == 'aliyun'){
			var data1 = that.get_signature(object.file,'attach');		
			data = boan_jq.extend(data,{
				'key':data1.dir+data1.object,
				'policy' : data1.policy,
				'OSSAccessKeyId':data1.accessid, 
				'success_action_status':'200',
				'signature': data1.signature,
			});	
			object.file.name = object.file.name.replace(/[\(\)'"<>]/g,'');
			object.file.objectname  =  data1.dir+data1.object;
		}else if( boan_h5upload_att_hlongup && boan_h5upload_ossserver == 'qiniu'){
			var data1 = that.get_signature(object.file,'attach');	 
			data = boan_jq.extend(data,{
				'key':data1.filename,
				'token' : data1.token,
			});	
			object.file.name = object.file.name.replace(/[\(\)'"<>]/g,'');
	 		object.file.objectname  =  data1.filename;
		}else if(boan_h5upload_att_hlongup && boan_h5upload_ossserver == 'tencent'){
			   var data1 = that.get_signature(object.file,'attach');
			   var credentials = data1.credentials;
			   var Authorization = CosAuth({
							SecretId: credentials.tmpSecretId,
							SecretKey: credentials.tmpSecretKey,
							Method: 'POST',
							Pathname: '/',
						});
						
				
				data = boan_jq.extend(data,{
					'key' : data1.dir+data1.object,
					'x-cos-security-token' : credentials.sessionToken || '',
					'Signature' : Authorization,
					
				});	
			 
			   object.file.name = object.file.name.replace(/[\(\)'"<>]/g,'');
			   object.file.objectname  =  data1.dir+data1.object;   
		 }else if(boan_h5upload_att_hlongup && boan_h5upload_ossserver == 'huawei'){
		   	   var data1 = that.get_signature(object.file,'image');
			   data = boan_jq.extend(data,{
					'policy' : data1.policy,
					'AccessKeyId' : data1.accessid,
					'signature' : data1.signature,
					'Key': data1.dir+data1.object,
					'acl': data1.acl,
					'content-type':data1.contenttype,
					});
			   delete object.transport.options.formData.uid;
			   delete object.transport.options.formData.type;
			   delete object.transport.options.formData.hash;
			   delete data.uid;
			   delete data.size;
			   delete data.id;
			   delete data.type;
			   delete data.hash;
			   delete data.filetype;
			   object.file.name = object.file.name.replace(/[\(\)'"<>]/g,'');
			   object.file.objectname  =  data1.dir+data1.object; 
		   }else if(boan_h5upload_att_hlongup && boan_h5upload_ossserver == 'AWS_S3'){
		   		 var data1 = that.get_signature(object.file,'image');
				 
				 data = boan_jq.extend(data,{
					'key':data1.key,
					'acl':data1.acl,
					'Content-Type':data1['Content-Type'],
					'Policy':data1.Policy,
					'X-Amz-Signature':data1['X-Amz-Signature'],
					'X-Amz-Algorithm':data1['X-Amz-Algorithm'],
					'X-Amz-Credential':data1['X-Amz-Credential'],
					'X-Amz-Date':data1['X-Amz-Date'],
				});
			   delete object.transport.options.formData.uid;
			   delete object.transport.options.formData.type;
			   delete object.transport.options.formData.hash;
			   delete data.uid;
			   delete data.size;
			   delete data.id;
			   delete data.type;
			   delete data.hash;
			   delete data.filetype;
    	       object.file.name = object.file.name.replace(/[\(\),&'"<>]/g,'');
			   object.file.objectname  =  data.key; 
		   }
    });

	uploader.on('uploadProgress',function(file,percentage){
		try {
			var progress = new FileProgress(file, upload.customSettings.progressTarget);
			progress.setStatus(boan_h5upload_lang['uppercent']+ parseInt(percentage*100)+"%)...");

		} catch (ex) {
			
		}
	});
	
	uploader.on('uploadStart',function(file){
		try {
			var progress = new FileProgress(file,upload.customSettings.progressTarget);
			boan_addpost(file,'filetype',file.ext);
			progress.setStatus(boan_h5upload_lang['uping']);
			if(upload.customSettings.uploadSource == 'forum') {
				var objId = upload.customSettings.uploadType == 'attach' ? 'attachlist' : 'imgattachlist';
				var attachlistObj = $(objId).parentNode;
				attachlistObj.scrollTop = $(file.id).offsetTop - attachlistObj.clientHeight;
			}
		} catch (ex) {
		}
	});
	
	uploader.on( 'uploadSuccess', function( file,response) {
		if(boan_h5upload_att_hlongup){
			var url = 'plugin.php?id=boan_h5upload:callback&type=forum&atttype=attach&filename=' + file.name + '&object=' + file.objectname +'&hash=' + upload.settings['post_params']['hash'];
			boan_jq.ajax({
					type:"GET",
					url:url,
					async:false,
					success:function(data){
						response = data;
					},
					error:function(xhr,status,error){
						alert(error);
						response = -10;
					},
			});
		}
	
		boanH5upload.uploadSuccess('',file,response,this);
		aid = parseInt(response);
		if(file.ext == 'png'){
			if(aid > 0){
				insertImg = function(aid){
					if($('attachname' + aid)){
						insertAttachimgTag(aid);
					}else{
						setTimeout(function(){
						  insertImg(aid);
						},250);
				    }
				}
				insertImg(aid);
			}
		}
		
	});
	
	uploader.on( 'uploadError', function( file ) {
		alert(boan_h5upload_lang['up_error']);
	});
	
	uploader.on( 'uploadComplete', function( file ) {
		//alert('上传完结');
	});
	
}

BoanH5upload.prototype.checkhHtml5 = function(){
    if (typeof(Worker) !== "undefined") {  
		return true;	
	} 
	else {
		return false;  
	}
}

BoanH5upload.prototype.getOs = function()  
{  
  try{
	   var browser = {
        versions: function () {
            var u = navigator.userAgent, app = navigator.appVersion;
            return {
                trident: u.indexOf('Trident') > -1, //IE内核
                presto: u.indexOf('Presto') > -1 || u.indexOf('OPR') > -1, //opera内核
                webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
                gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1,//火狐内核
                mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
                ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
                android: u.indexOf('Android') > -1 || u.indexOf('Adr') > -1, //android终端
                iPhone: u.indexOf('iPhone') > -1, //是否为iPhone或者QQHD浏览器
                iPad: u.indexOf('iPad') > -1, //是否iPad
                webApp: u.indexOf('Safari') == -1, //是否web应该程序，没有头部与底部
                weixin: u.indexOf('MicroMessenger') > -1, //是否微信 （2015-01-22新增）
                qq: u.match(/\sQQ/i) == " qq" //是否QQ
            };
        }(),
        language: (navigator.browserLanguage || navigator.language).toLowerCase()
    };
	
    return browser;
  }catch(e){
	  alert(e.message);
  }
    
} 

BoanH5upload.prototype.isFlash = function(){
  var flag = false;
  if(window.ActiveXObject){
	try{
	  var swf = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
	  if(swf){
		flag = true;
	  }
	}catch(e){
	}
  }else{
	try{
	  var swf = navigator.plugins['Shockwave Flash'];
	  if(swf){
		flag = true;
	  }
	}catch(e){
	}
  }
  (this.getOs().versions.gecko || this.getOs().versions.presto) && (flag = 0);
  return flag ;	  
}



BoanH5upload.prototype.check = function(){
	var flag = true;
	//检测原图片附件按钮是否存在
	
	if(!($('spanButtonPlaceholder') || $('SWFUpload_0'))){
		flag = false;
	}
	return flag;
	
}


boanH5upload = new BoanH5upload();

if(boanH5upload.check()){
	 //alert('可以设置了');
	 boanH5upload.setH5();
}else
{
	//alert('环境异常');
}
