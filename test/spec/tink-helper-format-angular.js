'use strict';
describe('tink-helper-format-angular', function() {

  var bodyEl = $('body'), sandboxEl;
  var $compile, $templateCache, scope;

  beforeEach(module('tink.formathelper'));

  beforeEach(inject(function (_$rootScope_, _$compile_, _$templateCache_) {
    scope = _$rootScope_.$new();
    $compile = _$compile_;
    $templateCache = _$templateCache_;
    bodyEl.html('');
    sandboxEl = $('<div>').attr('id', 'sandbox').appendTo(bodyEl);
  }));

  afterEach(function() {
    scope.$destroy();
    sandboxEl.remove();
  });

  function compileDirective(template, locals) {
    template = templates[template];
    angular.extend(scope, angular.copy(template.scope || templates['default'].scope), locals);
    var element = $(template.element).appendTo(sandboxEl);
    element = $compile(element)(scope);
    scope.$digest();
    return jQuery(element[0]);
  }

  function triggerInput(el,key){
    $(el).focus();
    for(var i =0; i< key.length;i++){
      var e = jQuery.Event('keypress');
      e.which = key.charCodeAt(i);
      $(el).trigger(e);
    }
  }

  var templates = {
    'default': {
      scope: {data:null},
      element: '<div tink-format-input ng-model="data"></div>'
    },
    'required': {
      scope: {data:null},
      element: '<div tink-format-input required ng-model="data"></div>'
    },
    'dates': {
      scope: {data:null},
      element: '<div tink-format-input min-date="minDate" max-date="maxDate" ng-model="data"></div>'
    }
  };


  describe('default', function() {
    it('should run this basic setup',function(){
      var element = compileDirective('default');
      var scope = element.isolateScope();
      scope.ctrl.setValue('20/01/2010');
      expect(scope.ctrl.getValue()).toBe('20/01/2010');
    });

    it('should have the right html',function(){
      var element = compileDirective('default');
      var scope = element.isolateScope();
      scope.ctrl.setValue('20/01/2010');
      expect(scope.ctrl.element.html()).toBe('20<span class="placeholder">/</span>01<span class="placeholder">/</span>2010');
    });

    it('should be valid without required',function(){
      var element = compileDirective('default');
      var scope = element.isolateScope();
      expect(scope.ctrl.ngControl.$valid).toBe(true);
      expect(scope.ctrl.ngControl.$invalid).toBe(false);
    });

    it('should be invalid with required attribute',function(){
      var element = compileDirective('required');
      var scope = element.isolateScope();
      expect(scope.ctrl.ngControl.$valid).toBe(false);
      expect(scope.ctrl.ngControl.$invalid).toBe(true);
      expect(scope.ctrl.ngControl.$error.required).toBe(true);
    });

    it('should be invalid with wrong date',function(){
      var element = compileDirective('required');
      var scope = element.isolateScope();
      triggerInput(element.find('div.faux-input'),'20-01-199');
      element.find('div.faux-input').blur();
      scope.$digest();
      expect(scope.ctrl.ngControl.$error.date).toBe(true);
    });

    it('should be valid when proper date',function(){
      var element = compileDirective('required');
      var scope = element.isolateScope();
      triggerInput(element.find('div.faux-input'),'20-01-1992');
      element.find('div.faux-input').blur();
      scope.$digest();
      expect(scope.ctrl.ngControl.$valid).toBe(true);
      expect(scope.ctrl.ngControl.$invalid).toBe(false);
    });

    it('should be valid when proper date',function(){
      var element = compileDirective('required');
      var scope = element.isolateScope();
      triggerInput(element.find('div.faux-input'),'20-01-1992');
      element.find('div.faux-input').blur();
      scope.$digest();
      expect(scope.ctrl.ngControl.$valid).toBe(true);
      expect(scope.ctrl.ngControl.$invalid).toBe(false);
    });
    
    it('should be invalid when min date is wrong',function(){
      var element = compileDirective('dates',{minDate:new Date()});
      var scope = element.isolateScope();
      triggerInput(element.find('div.faux-input'),'20-01-1992');
      element.find('div.faux-input').blur();
      scope.$digest();
      expect(scope.ctrl.ngControl.$valid).toBe(false);
      expect(scope.ctrl.ngControl.$invalid).toBe(true);
      expect(scope.ctrl.ngControl.$error['date-min']).toBe(true);
    });

    it('should be invalid when max date is wrong',function(){
      var element = compileDirective('dates',{maxDate:new Date(1992,0,20)});
      var scope = element.isolateScope();
      triggerInput(element.find('div.faux-input'),'21-01-1992');
      element.find('div.faux-input').blur();
      scope.$digest();
      expect(scope.ctrl.ngControl.$valid).toBe(false);
      expect(scope.ctrl.ngControl.$invalid).toBe(true);
      expect(scope.ctrl.ngControl.$error['date-max']).toBe(true);
    });    
  });
});