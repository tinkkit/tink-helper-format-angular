'use strict';
(function(module) {
  try {
    module = angular.module('tink.formathelper');
  } catch (e) {
    module = angular.module('tink.formathelper', ['tink.datehelper','tink.safeApply']);
  }
  module.controller('tinkFormatController',['$scope',function($scope){

    var self = this;
    var config;
    var format;
    var placeholder;
    var newVa;
    var deleteVal = -1;
    var controlKey = 0;
    var keyDowned = '';
    self.init = function(element,config,form,ngControl){
      self.element = element;
      self.config = config;
      self.form = form;
      self.ngControl = ngControl;
      loadAll();
    };

    function loadAll(){
      config = self.config;
      format = config.format;
      placeholder = config.placeholder;
      //$scope.placeholder = valueToHtml(placeholder);
      self.setValue(placeholder);
      newVa = placeholder;
      self.element.bind('keydown', function(event) {
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
      });
      self.element.bind('keyup', function(event) {
        if(event.which ===91 || event.which === 92 || event.which === 93){
          controlKey = 0;
        }
      });
      self.element.bind('mousedown', function() {
        if($scope.isDisabled !== true){
          setTimeout(function() {
            if (placeholder === newVa) {
              setCursor(0);
            }
          }, 1);
        }else{
          return false;
        }
      });

      self.element.bind('focus',function(){
        setTimeout(function(){
          var pos = firstCh();
          if(pos !== newVa.length){
            setCursor(firstCh());
          }
        },20);
      });

      self.element.bind('paste', function (e) {
          var cursor = getCaretSelection();
          e.preventDefault();
          var text = (e.originalEvent || e).clipboardData.getData('text/plain');
          window.document.execCommand('insertText', false, text);
          self.setValue(keyDowned);
          for(var i=0;i<text.length;i++){
            handleInput(text[i],cursor);
            cursor++;
          }
      });

      self.element.keypress(function(event) {
        if(!controlKey){
          var key = String.fromCharCode(event.which);
          handleInput(key);
          return false;
        }
      });

      if(self.form){
        //setTimeout(function(){ self.form.$addControl(self.ngControl); }, 0);
      }

    }
    String.prototype.replaceAt = function(index, character) {
      return this.substr(0, index) + character + this.substr(index + character.length);
    };
    String.prototype.replaceRange = function(start, stop, value) {
      return this.substr(0, start) + value.substr(start, stop - start) + this.substr(stop);
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

      if (cursor > -1 && cursor < format.length) {
        if (format[cursor] === '0') {
          if (charIs(key, '0')) {
            if (cursor !== selection) {
              newVa = newVa.replaceRange(cursor, selection, placeholder);
            }
            newVa = newVa.replaceAt(cursor, key);
            cursor += 1;
          } else {
            newVa = newVa.replaceRange(cursor, selection, placeholder);
          }
        } else {
          if (charIs(key, '0')) {
            handleInput(key, {
              start: cursor + 1,
              end: selection + 1
            });
            return;
          } else {
            cursor += 1;
          }
        }
      }
      deleteVal = -1;
      self.setValue(newVa,cursor);
    }

    function handleBackspace() {
      var cursor = getCaretSelection();
      if (cursor.start === cursor.end && cursor.start > 0) {
        newVa = newVa.replaceAt(cursor.start - 1, placeholder[cursor.start - 1]);
        self.setValue(newVa,cursor.start - 1);
      } else {
        newVa = newVa.replaceRange(cursor.start, cursor.end, placeholder);
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
        self.setValue(newVa,pos);

      } else {
        newVa = newVa.replaceRange(cursor.start, cursor.end, placeholder);
        self.setValue(newVa,cursor.start);
      }
    }

    function firstCh(){
      for(var i=0;i<newVa.length;i++){
        if(newVa.length === format.length){
          if(format[i] === '0'){
            if(newVa[i] >-1 && newVa[i] < 10){

            }else{
              return i;
            }
          }
        }else{
          return 0;
        }
      }
      return newVa.length;
    }

    function valueToHtml(value) {
      var html = '';                // weekDaysLabels.join('</th><th class="dow text-center">') + '</th>')
      var plHtml = '<span class="placeholder">';
      var plEHtml = '</span>';
      var open = 0;
      for (var i = 0; i < placeholder.length; i++) {
        if (placeholder[i] === value[i]) {
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

  self.setValue = function(value,cur,force) {

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
      self.element.trigger('valueChanged',[newVa]);
    }else{
      self.element.val(newVa);
    }
    if (cur && cur > -1 && cur <= format.length) {
      setCursor(cur);
    }
  };

  self.getValue = function(){
    return newVa;
  };

  function charIs(char, base) {
    char = char.trim();
    if (base === '0' && char !== '') {
      if (char > -1 && char < 10) {
        return true;
      }
    }
    return false;
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
  range.setStart(chosenChild, cur);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  el.focus();
}

}]);
})();