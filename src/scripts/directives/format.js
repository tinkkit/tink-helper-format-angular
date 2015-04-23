'use strict';
(function(module) {
  try {
    module = angular.module('tink.formathelper');
  } catch (e) {
    module = angular.module('tink.formathelper', []);
  }
  module.directive('tinkFormatInput', ['dateCalculator', '$window', 'safeApply', function(dateCalculator, $window, safeApply) {
    return {
      restrict: 'EA',
      replace: true,
      priority:99,
      controller:'tinkFormatController',
      scope:{
        minDate:'=?',
        maxDate:'=?'
      },
      require:['tinkFormatInput','ngModel','?^form'],
      template: function() {
        var isNative = /(ip(a|o)d|iphone|android)/ig.test($window.navigator.userAgent);
        var isTouch = ('createTouch' in $window.document) && isNative;
        if (isTouch) {
          return '<div><input id="input" class="faux-input" type="date"/><div>';
        } else {
          return '<div tabindex="-1"><div  id="input" role="textbox" class="faux-input" contenteditable="true">{{placeholder}}</div></div>';
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
          if(attr.require === 'true'){
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
                ngControl.$setValidity('date-required',true);
                errorElem.addClass(noErrorClass);
              }
            }else if(stringValue !== config.placeholder && stringValue !== null){
              ngControl.$setValidity('date',false);
              ngControl.$setValidity('date-min',true);
              ngControl.$setValidity('date-max',true);
              errorElem.removeClass(noErrorClass);
              if(isRequired){
                ngControl.$setValidity('date-required',true);
              }
            }else{
              ngControl.$setValidity('date',true);
              ngControl.$setValidity('date-min',true);
              ngControl.$setValidity('date-max',true);
              errorElem.addClass(noErrorClass);
              if(isRequired){
                ngControl.$setValidity('date-required',false);
                errorElem.removeClass(noErrorClass);
              }
            }

          });
        }

 //format text going to user (model to view)
        scope.$watch('$parent.'+ attr.ngModel, function(newVal,oldval) {
          if(!isTouch || isTouch && newVal !== ''){
              if(newVal != 'Invalid Date' && angular.isDate(newVal)){
                var date = dateCalculator.format(newVal,dateformat);
                controller.setValue(date,null,isTouch);
                checkValidity(newVal);
              }else{
                controller.setValue(null,null,isTouch);
              }
            }else{
               controller.setValue('',null,isTouch);
            }
            checkValidity(newVal);
        }, true);

        controller.init(element,config,form,ngControl);
         
         /* ngControl.$formatters.push(function(modelValue) {
           
          });
*/



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
              if(isTouch){
                value = element.val();
              }else{
                value = controller.getValue();
              }
              if(value === config.placeholder){
                checkValidity(value);
              }else{
                var date = dateCalculator.getDate(value,dateformat);
                if(date === null){
                  checkValidity(value);
                }else{
                  checkValidity(date);
                }
                ngControl.$setViewValue(value);
                ngControl.$setDirty();
                ngControl.$render();
              }

            });
          });
      }
    };

  }
};
}]);
})();