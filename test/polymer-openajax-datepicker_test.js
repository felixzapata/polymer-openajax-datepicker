/* global sinon */
describe('polymer-openajax-datepicker', function() {
  it('should open a calendar with current date on January 24, 2019', function(done) {
    var clock = sinon.useFakeTimers(new Date(2019, 0, 24).getTime());
    var element = fixture('BasicTestFixture');
    var root;
    var datePicker;
    var table;
    element.showDlg();
    flush(function() {
      root = element.shadowRoot;
      datePicker = root.querySelector('#dp1');
      table = datePicker.querySelector('table');
      expect(table.querySelectorAll('thead th').length).to.be.equal(7);
      expect(datePicker.querySelector('#month').firstChild.nodeValue).to.equal('January 2019');
      expect(table.querySelectorAll('tbody .empty').length).to.be.equal(4);
      expect(table.querySelectorAll('tbody td[id]').length).to.be.equal(31);
      expect(table.querySelector('#day24').classList.contains('today')).to.be.equal(true);
      done();
    });
    clock.restore();
  });
});
