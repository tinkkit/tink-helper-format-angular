'use strict';
(function(module) {
  try {
    module = angular.module('tink.formathelper');
  } catch (e) {
    module = angular.module('tink.formathelper', ['tink.datehelper','tink.safeApply']);
  }
  module.controller('tinkFormatController',['$scope','safeApply',function($scope,safeApply){

    var self = this;
    var config;
    var format;
    var placeholder;
    var newVa;
    var deleteVal = -1;
    var controlKey = 0;
    var keyDowned = '';
    var prevValue;
    var pressedKeys = [];
    String.prototype.contains = function(it) { return this.indexOf(it) !== -1; };
    self.init = function(element,config,form,ngControl){
      self.element = element;
      self.config = config;
      self.form = form;
      self.ngControl = ngControl;
      loadAll();
    };

    /*function getFormat(regex){
      var ra = new RandExp(new RegExp(regex));
      var gens = [];
      for (var i = 0; i < 10; i++) {
        gens.push(ra.gen());
      }
    }*/

    function loadAll(){
      config = self.config;
      format = config.format;

      if(format && format.contains('00')){
        format = format.replace(/0/gi, '[0-9]');
        format = format.replace(/\//gi, '\/');
      }

      placeholder = config.placeholder;
      self.setValue(placeholder,null,null,false);
      newVa = placeholder;
      prevValue = placeholder;
      self.element.bind('drop',function(e){
        if(!self.isDisabled()){
          var value = e.originalEvent.dataTransfer.getData('Text');
          self.setValue(value);
          self.element.blur();
        }
        return false;
      });
      self.element.bind('keydown', function(event) {
        if(!self.isDisabled()){
          keyDowned = self.getValue();
          if(event.which ===91 || event.which === 92 || event.which === 93){
            controlKey = 1;
          }
          if((event.ctrlKey||event.metaKey) && event.which === 88){
            setTimeout(function() {
              self.setValue(placeholder);
            }, 1);
            return true;
          }
          if (event.which === 8) {
            handleBackspace();
            return false;

          } else if (event.which === 46) {
            handleDelete();
            return false;
          }
        }else{
          if((event.ctrlKey||event.metaKey) && event.which === 67){
            return true;
          }
          event.preventDefault();
          event.stopPropagation();
        }
      });
      self.element.bind('keyup', function(event) {
        if(!self.isDisabled()){
          if(event.which ===91 || event.which === 92 || event.which === 93){
            controlKey = 0;
          }
        }
      });


      self.element.on('cut',function(e){
        safeApply($scope,function(){
          var cursor = getCaretSelection();
          if(cursor){
            var value = self.getValue();
            value = value.replaceValue(cursor.start,cursor.end,placeholder.substr(cursor.start,cursor.end-cursor.start));
            self.setValue(value);
          }else{
            e.preventDefault();
            e.stopPropagation();
          }
        });
      });

      self.element.bind('focusin', function(event) {
        if(self.isDisabled() && self.getValue() !== placeholder){
          event.preventDefault();
          event.stopPropagation();
        }
      });
      self.element.bind('mousedown', function() {
        if(self.isDisabled()){
          if(self.getValue() === placeholder){
            return false;
          }
        }
      });

      self.element.bind('focus',function(){
        setTimeout(function(){
          if(!self.isDisabled()){
            var pos = firstCh();
            if(pos !== config.placeholder.length){
              setCursor(firstCh());
            }
          }
        },5);
      });



      self.element.bind('paste', function (e) {
        if(!self.isDisabled()){
          var cursor = getCaretSelection();
          e.preventDefault();
          var text = (e.originalEvent || e).clipboardData.getData('text/plain');
          window.document.execCommand('insertText', false, text);
          self.setValue(keyDowned);
          for(var i=0;i<text.length;i++){
            handleInput(text[i],cursor);
            cursor++;
          }
        }
      });
        $(function(){

   // WebKit contentEditable focus bug workaround:
   if(/AppleWebKit\/([\d.]+)/.exec(navigator.userAgent)) {
    var editableFix = $('<input style="width:1px;height:1px;border:none;margin:0;padding:0;" tabIndex="-1">').appendTo('html');
    $('[contenteditable]').blur(function () {
        editableFix[0].setSelectionRange(0, 0);
        editableFix.blur();
    });
   }
  });

       self.element.bind('blur', function (e) {

       });
      self.element.keypress(function(event) {
        // console.log(event)
        if(!self.isDisabled()){
          if(!controlKey){
            var key = String.fromCharCode(event.which);
            handleInput(key);
            return false;
          }
        }return false;
      });

      if(self.form){
        //setTimeout(function(){ self.form.$addControl(self.ngControl); }, 0);
      }

    }
    String.prototype.replaceAt = function(index, character) {
      if(character)
      return this.substr(0, index) + character + this.substr(index + character.length);
    };
    String.prototype.replaceRange = function(start, stop, value) {
      return this.substr(0, start) + value.substr(start, stop - start) + this.substr(stop);
    };
    String.prototype.replaceValue = function(start, stop, value) {
      return this.substr(0, start) + value.substr(0, stop - start) + this.substr(stop);
    };

    function handleInput(key, cur) {
      var cursor;
      var selection;
      if (!cur) {
        cursor = getCaretSelection().start;
        selection = getCaretSelection().end;
      } else {
        cursor = cur.start;
        selection = cur.end;
      }

      var ra = new RandExp(new RegExp(format));
      var placeFormat = ra.gen();

      if(/^[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(placeFormat[cursor])){
        cursor += 1;
        selection+=1;
      }
      if(/[A-Z]/.test( placeFormat[cursor])){
        key = key.toUpperCase();
      }

      if (cursor > -1 && cursor < placeFormat.length) {
          if (charIs(key, cursor)) {
            if (cursor !== selection) {
              newVa = newVa.replaceRange(cursor, selection, placeholder);
            }
            newVa = newVa.replaceAt(cursor, key);
            cursor += 1;
          } else {
            newVa = newVa.replaceRange(cursor, selection, placeholder);
          }
      }
      deleteVal = -1;
      self.setValue(newVa,cursor);
    }

    function handleBackspace() {
      var cursor = getCaretSelection();
      if (cursor.start === cursor.end && cursor.start > 0) {
        delete pressedKeys[cursor.start-1];
        newVa = newVa.replaceAt(cursor.start - 1, placeholder[cursor.start - 1]);
        self.setValue(newVa,cursor.start - 1);
      } else {
        newVa = newVa.replaceRange(cursor.start, cursor.end, placeholder);
        for(var i=cursor.start;i<=cursor.end;i++){
          delete pressedKeys[i-1];
        }
        self.setValue(newVa,cursor.start);
      }

    }

    function handleDelete() {
      var cursor = getCaretSelection();
      if (cursor.start === cursor.end) {
        var pos = cursor.start;
        while (placeholder[cursor.start] === newVa[cursor.start] && cursor.start < placeholder.length - 1) {
          cursor.start++;
        }
        newVa = newVa.replaceAt(cursor.start, placeholder[cursor.start]);
        delete pressedKeys[cursor.start];
        self.setValue(newVa,pos);

      } else {
        newVa = newVa.replaceRange(cursor.start, cursor.end, placeholder);
        self.setValue(newVa,cursor.start);
      }
    }

    function firstCh(){
      return 0 ;
    }

    function valueToHtml(value) {
      var html = '';                // weekDaysLabels.join('</th><th class="dow text-center">') + '</th>')
      var plHtml = '<span class="placeholder">';
      var plEHtml = '</span>';
      var open = 0;
      for (var i = 0; i < placeholder.length; i++) {
        if (placeholder[i] === value[i] && pressedKeys[i] !== placeholder[i]) {
          if (open === 0) {
            html += plHtml + value[i];
            open = 1;
          } else if (open === 1) {
            html += value[i];
          }
        } else {
          if (open === 1) {
            html += plEHtml + value[i];
            open = 0;
          } else {
            html += value[i];
          }
        }
      }
      if (open === 1) {
        html += plEHtml;
      }
      return html;
  }

  self.disableElements = function(el) {
    if(el){
      for (var i = 0; i < el.length; i++) {
        $(el[i]).attr('disabled', 'disabled');
        //$(el[i]).attr('tabindex', '-1');
        self.disableElements($(el[i]).children());
      }
    }
  };

  self.enableElements = function(el) {
    if(el){
      for (var i = 0; i < el.length; i++) {
        $(el[i]).removeAttr('disabled', 'disabled');
       // $(el[i]).removeAttr('tabindex', '-1');
        self.enableElements($(el[i]).children());
      }
    }
  };

  self.isDisabled = function(){
    return $scope.isDisabled;
  };



  $scope.$watch(function(){return self.isDisabled();},function(newVal){
    if(newVal){
      self.disableElements(self.element);
      $(self.element).removeAttr('contenteditable');
    }else{
      self.enableElements(self.element);
      $(self.element).attr('contenteditable','true');
    }
  });



  self.setValue = function(value,cur,force,ignore) {
    if(!self.element[0]){
      return;
    }
    if(!force){
      if(value && value.length !== placeholder.length){
        newVa = placeholder;
      }else if(!value){
        newVa = placeholder;
      }else{
        newVa = value;
      }
    }else{
      newVa = value;
    }

    if(self.element[0].nodeName === 'DIV'){
      self.element.html(valueToHtml(newVa));
      if(self.isDisabled()){
        self.element.find('span').attr('disabled','disabled');
        self.element.find('span').unbind('mousedown');
      }
      if(prevValue !== newVa && ignore !== false){
        self.element.trigger('valueChanged',[newVa]);
      }
    }else{
      self.element.val(newVa);
      self.element.trigger('valueChanged',[newVa]);
    }
    if (cur && cur > -1 && cur <= format.length) {
      setCursor(cur);
    }
      prevValue = newVa;
  };

  self.getValue = function(){
    return newVa;
  };

  self.setCurs = function(){
    setCursor(0);
  };

  function charIs(char, cur) {
    var ra = new RandExp(new RegExp(format));
    var placeFormat = ra.gen();
    placeFormat = placeFormat.replaceAt(cur, char);
    var expresion = new RegExp(format).test(placeFormat);
    if(expresion){
      pressedKeys[cur] = char;
    }
    return expresion;
  }

  function getCaretSelection() {
    var caretOffset = 0;
    var element = self.element.get(0);
    element.focus();
    var doc = element.ownerDocument || element.document;
    var win = doc.defaultView || doc.parentWindow;
    var sel;
    var startOffset;

    if (typeof win.getSelection !== 'undefined') {
      sel = win.getSelection();
      if (sel.rangeCount > 0) {
        var range = win.getSelection().getRangeAt(0);
        var preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        caretOffset = preCaretRange.toString().length;
        startOffset = caretOffset - window.getSelection().toString().length;
      }
    } else if ((sel = doc.selection) && sel.type !== 'Control') {
      var textRange = sel.createRange();
      var preCaretTextRange = doc.body.createTextRange();
      preCaretTextRange.moveToElementText(element);
      preCaretTextRange.setEndPoint('EndToEnd', textRange);
      caretOffset = preCaretTextRange.text.length;
      startOffset = caretOffset - document.selection.createRange().text.length;

    }
    return {
      start: startOffset,
      end: caretOffset
    };
  }

function setCursor(cur) {
  var el = self.element[0];
  var range = document.createRange();
  var sel = window.getSelection();
  var lengths = 0;
  var chosenChild = 0;
  for (var i = 0; i < self.element[0].childNodes.length; i++) {
    var node = self.element[0].childNodes[i];
    if (node.nodeName === '#text') {
      lengths += node.length;
      chosenChild = node;
    } else {
      lengths += node.childNodes[0].length;
      chosenChild = node.childNodes[0];
    }
    if (cur <= lengths) {
      cur = cur - (lengths - chosenChild.length);
      i = 9999;
    }
  }
  if(chosenChild !== 0){
    range.setStart(chosenChild, cur);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  el.focus();
}

}]);
})();;'use strict';
(function(module) {
  try {
    module = angular.module('tink.formathelper');
  } catch (e) {
    module = angular.module('tink.formathelper', ['tink.datehelper','tink.safeApply']);
  }
  module.directive('tinkFormatInput', ['dateCalculator', '$window', 'safeApply', function(dateCalculator, $window, safeApply) {
    return {
      restrict: 'EA',
      replace: true,
      priority:99,
      controller:'tinkFormatController',
      controllerAs:'ctrl',
      scope:{
        minDate:'=?',
        maxDate:'=?',
        isDisabled:'=?'
      },
      require:['tinkFormatInput','ngModel','?^form'],
      template: function() {
        var isNative = /(ip(a|o)d|iphone|android)/ig.test($window.navigator.userAgent);
        var isTouch = ('createTouch' in $window.document) && isNative;
        if (isTouch) {
          return '<div><input id="input" class="faux-input" type="date"/><div>';
        } else {
          return '<div><div  id="input" role="textbox" class="faux-input" contenteditable="true" data-ng-bind="placeholder"></div></div>';
        }
      },
      compile: function(template) {
        template.prop('type', 'date');
        return {
          pre: function() {
          },
          post: function(scope, elem, attr, ctrl) {
            // -- check if we are using a touch device  --/
            var isDateSupported = function() {
              var i = document.createElement('input');
              i.setAttribute('type', 'date');
              return i.type !== 'text';
            };

            var isNative = /(ip(a|o)d|iphone|android)/ig.test($window.navigator.userAgent);
            var isTouch = ('createTouch' in $window.document) && isNative && isDateSupported();
        //variable
        var config = {
          format: '00/00/0000',
          placeholder: 'dd/mm/jjjj'
        };
        var dateformat;
        if(isTouch){
          dateformat = 'yyyy-mm-dd';
          config.placeholder = 'yyyy-MM-dd';
        }else{
          dateformat = 'dd/mm/yyyy';
        }

        var element = elem.find('#input');
        var ngControl = ctrl[1];
        var controller = ctrl[0];
        var form = ctrl[2];

        var prefix = '';
        if(angular.isDefined(attr.validName)){
          setTimeout(function(){
            if(form && attr.name && typeof attr.name === 'string' && attr.name !== ''){
            safeApply(scope,function(){
              prefix = attr.validName;
              form.$removeControl(ngControl);
              ngControl.$name = prefix+attr.name;
              form.$addControl(ngControl);
            });
          }
          }, 1);
        }else{
          setTimeout(function(){
            safeApply(scope,function(){
              if(form){
                form.$addControl(ngControl);
              }
            });
          }, 1);
        }

        function validFormat(date,format){
          var dateObject;
          if(angular.isDefined(date) && date !== null){

            if(typeof date === 'string'){
              if(date.length !== 10){ return false; }

              if(!isTouch && !/^(?:(?:31(\/)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/.test(date)){return false;}

              dateObject = dateCalculator.getDate(date, format);
            }else if(angular.isDate(date)){
              dateObject = date;
            }else if(typeof date === 'function'){
              return validFormat(date(),format);
            }else {
              return false;
            }

            return dateObject.toString()!=='Invalid Date';
          }
        }

        var isRequired = (function(){
          if(attr.required || attr.require){
            return true;
          }else{
            return false;
          }
        })();
        var noErrorClass = 'hide-error';
        var errorElem = $(elem.find('.faux-input')[0]);

        function checkValidity(value){
          var stringValue;
          if(value != 'Invalid Date' && angular.isDate(value)){
            stringValue = dateCalculator.format(value,dateformat);
          }else{
            stringValue = value;
          }


          safeApply(scope,function(){

            if(angular.isDate(scope.minDate)){
              if(dateCalculator.dateBeforeOther(value,scope.minDate)){
                ngControl.$setValidity('date-min',true);
                errorElem.addClass(noErrorClass);
              }else{
                ngControl.$setValidity('date-min',false);
                errorElem.removeClass(noErrorClass);
              }

            }
            if(angular.isDate(scope.maxDate)){
              if(dateCalculator.dateBeforeOther(scope.maxDate,value)){
                ngControl.$setValidity('date-max',true);
                errorElem.addClass(noErrorClass);
              }else{
                ngControl.$setValidity('date-max',false);
                errorElem.removeClass(noErrorClass);
              }
            }

            if(validFormat(stringValue,dateformat)){
              ngControl.$setValidity('date',true);
              errorElem.addClass(noErrorClass);
              if(isRequired){
                ngControl.$setValidity('required',true);
                errorElem.addClass(noErrorClass);
              }
            }else if(stringValue !== config.placeholder && stringValue !== null){
              ngControl.$setValidity('date',false);
              ngControl.$setValidity('date-min',true);
              ngControl.$setValidity('date-max',true);
              errorElem.removeClass(noErrorClass);
              if(isRequired){
                ngControl.$setValidity('required',true);
              }
            }else{
              ngControl.$setValidity('date',true);
              ngControl.$setValidity('date-min',true);
              ngControl.$setValidity('date-max',true);
              errorElem.addClass(noErrorClass);
              if(isRequired){
                ngControl.$setValidity('required',false);
                errorElem.removeClass(noErrorClass);
              }
            }

          });
        }
        var myWatch = 0;
 //format text going to user (model to view)
        scope.$watch('$parent.'+ attr.ngModel, function(newVal) {
          if(myWatch === 0){
            if(!isTouch || isTouch && newVal !== ''){
              if(newVal != 'Invalid Date' && angular.isDate(newVal)){
                var date = dateCalculator.format(newVal,dateformat);
                controller.setValue(date,null,isTouch,false);
                checkValidity(newVal);
              }else{
                controller.setValue(null,null,isTouch,false);
              }
            }else{
               controller.setValue('',null,isTouch,false);
            }
            checkValidity(newVal);
          }else{
            myWatch = 0;
          }
        }, true);

        controller.init(element,config,form,ngControl);

          //format text from the user (view to model)
          ngControl.$parsers.unshift(function(value) {

              if(isTouch && value === ''){
                value = element.val();
              }

            if(value === null || value === ''){
              return value;
            }else if(typeof value === 'string'){
              controller.setValue(value,null,isTouch);
              return dateCalculator.getDate(value,dateformat);
            }else{
              return null;
            }
          });
          element.unbind('input').unbind('change');

          //on blur update the model.
          element.on('blur', function() {
            safeApply(scope,function(){
              var value;
              var date;
              if(isTouch){
                value = element.val();
              }else{
                var values = $(element).clone().contents().contents().unwrap()[0];
                if(values){
                  value = values.wholeText;
                }
              }
              if(value === config.placeholder || value === undefined){
                checkValidity(value);
                //ngControl.$setViewValue();
              }else{
                date = dateCalculator.getDate(value,dateformat);
                if(date === null){
                  checkValidity(value);
                }else{
                  checkValidity(date);
                }
                controller.setValue(value);
                //fires 2 watches !
                //ngControl.$setViewValue(value);
                //ngControl.$setDirty();
                //ngControl.$render();
              }

              if(!validFormat(date,dateformat)){
                myWatch = 1;
               // controller.setValue(date);
              }
            });
          });
      }
    };

  }
};
}]);
})();;