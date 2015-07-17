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

  var templates = {
    'default': {
      scope: {data:null},
      element: '<div tink-format-input ng-model="data"></div>'
    },
    'required': {
      scope: {data:null},
      element: '<div tink-format-input required ng-model="data"></div>'
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
  });


});