/* eslint-disable class-methods-use-this */
/**
 * `polymer-openajax-datepicker`
 * Polymer component based on the accessible Date Picker from Open Ajax Alliance
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class PolymerOpenajaxDatePicker extends Polymer.Element {
  static get is() { return 'polymer-openajax-datepicker'; }

  static get properties() {
    return {
      /**
       * True if datepicker should appear in a modal dialog box.
       */
      bModal: Boolean,
      /**
       * The selected date
       * Based on ISO 8601
       * http://momentjs.com/docs/#/parsing/
       */
      date: {
        type: String,
        notify: true
      },
      /**
       * Localize the calendar.
       * Based on Moment.js
       * https://momentjs.com/docs/#/i18n/
       */
      locale: {
        type: String,
        value: 'en',
        notify: true,
        observer: '_localeChanged'
      },
      /**
       * Optional init date for the calendar
       * Based on ISO 8601
       * http://momentjs.com/docs/#/parsing/
       */
      initDate: {
        type: String,
        value: '',
        observer: '_initDateChanged'
      },
      /**
       * Optional min date for the calendar
       * Based on ISO 8601
       * http://momentjs.com/docs/#/parsing/
       */
      minDate: {
        type: String,
        notify: true,
        value: '',
        observer: '_minDateChanged'
      },
      /**
       * Optional max date for the calendar
       * Based on ISO 8601
       * http://momentjs.com/docs/#/parsing/
       */
      maxDate: {
        type: String,
        value: '',
        notify: true
      }
    };
  }

  _renderCalendar() {
    this.dateObj = (this.initDate !== '') ? window.moment(this.initDate) : window.moment();

    this.curYear = this.dateObj.year();
    this.year = this.curYear;

    this.curMonth = this.dateObj.month();
    this.month = this.curMonth;
    this.currentDate = true;

    // display the current month
    this.$monthObj.innerHTML = this.monthNames[this.month] + ' ' + this.year;

    // populate the header of the calendar
    this._popHeader();

    // populate the calendar grid
    this._popGrid();

    // update the table's activedescdendant to point to the current day
    this.$grid.setAttribute('aria-activedescendant', this.$grid.querySelector('.today').getAttribute('id'));

    this._bindHandlers();
    this._bindCellsClickHandlers();
  }

  connectedCallback() {
    super.connectedCallback();
    // element to attach widget to
    this.$id = this.shadowRoot.querySelector('#dp1');
    this.$monthObj = this.$id.querySelector('#month');
    this.$prev = this.$id.querySelector('#bn_prev');
    this.$next = this.$id.querySelector('#bn_next');
    this.$grid = this.$id.querySelector('#cal');

    // bind button handlers
    this._handlePrevClick = this._handlePrevClick.bind(this);
    this._handleNextClick = this._handleNextClick.bind(this);
    this._handlePrevKeyDown = this._handlePrevKeyDown.bind(this);
    this._handleNextKeyDown = this._handleNextKeyDown.bind(this);
    this._handleGridKeyDown = this._handleGridKeyDown.bind(this);
    this._handleGridKeyPress = this._handleGridKeyPress.bind(this);
    this._handleGridFocus = this._handleGridFocus.bind(this);
    this._handleGridBlur = this._handleGridBlur.bind(this);

    this.keys = {
      tab: 9,
      enter: 13,
      esc: 27,
      space: 32,
      pageup: 33,
      pagedown: 34,
      end: 35,
      home: 36,
      left: 37,
      up: 38,
      right: 39,
      down: 40
    };

    if(this.maxDate !== '') {
      this.maxDateMoment = window.moment(this.maxDate);
    }

    if(this.minDate !== '') {
      this.minDateMoment = window.moment(this.minDate);
    }
    this._renderCalendar();

    // hide dialog if in modal mode
    if(this.bModal === true) {
      this.$id.setAttribute('aria-hidden', 'true');
    }

    this._handlerShowDlg = function (e) {
      // ensure focus remains on the dialog
      this.$grid.focus();
      // Consume all mouse events and do nothing
      e.stopPropagation();
      return false;
    };
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unBindHandlers();
    this._unBindCellsClickHandlers();
  }

  _initDateChanged(newInitDate, oldInitDate) {
    if(typeof oldInitDate !== 'undefined' && newInitDate !== oldInitDate) {
      Polymer.RenderStatus.afterNextRender(this, function() {
        this._unBindHandlers();
        this._unBindCellsClickHandlers();
        this._renderCalendar();
      });
    }
  }

  _minDateChanged(minDate) {
    if(minDate !== '') {
      this.minDateMoment = window.moment(minDate);
      Polymer.RenderStatus.afterNextRender(this, function() {
        this._checkDatesRange();
        this._updateAvailableDays();
      });
    }
  }

  /**
    * It checks the maxDate and minDate with the date to see if the prev and next buttons must be visible
    * @method _checkDatesRange
  * */
  _checkDatesRange() {
    // eslint-disable-next-line
    this.shouldDisableNext = this.maxDateMoment && this.month === this.maxDateMoment.month() && this.year === this.maxDateMoment.year();
    // eslint-disable-next-line
    this.shouldDisablePrev = this.minDateMoment && this.month === this.minDateMoment.month() && this.year === this.minDateMoment.year();
    this.$next.setAttribute('aria-hidden', this.shouldDisableNext);
    this.$prev.setAttribute('aria-hidden', this.shouldDisablePrev);
  }

  //
  // _popHeader() is a member function to populate the datepicker header with days of the week
  //
  // @return N/A
  //

  _popHeader() {
    var thead = this.$grid.querySelector('thead');
    var weekday = 0;
    var cellsHeader = '\t<tr id="row1">\n';
    // Insert the leading empty cells
    thead.innerHTML = '';
    for(; weekday < 7; weekday++) {
      // eslint-disable-next-line
      cellsHeader += '\t\t<th id="' + this.dayNames[weekday] + '"><abbr title="' + this.dayNames[weekday] + '">' + this.dayNamesAbbr[weekday] + '</abbr></th>\n';
    }
    cellsHeader += '</tr>';
    thead.insertAdjacentHTML('beforeend', cellsHeader);
  }

  //
  // _popGrid() is a member function to populate the datepicker grid with calendar days
  // representing the current month
  //
  // @return N/A
  //
  _popGrid() {
    var numDays = this._calcNumDays(this.year, this.month);
    var startWeekday = this._calcStartWeekday(this.year, this.month);
    var weekday = 0;
    var curDay = 1;
    var rowCount = 1;
    var $tbody = this.$grid.querySelector('tbody');
    var dayOfMonth = this.dateObj.date();

    var gridCells = '\t<tr id="row1">\n';

    // clear the grid
    $tbody.innerHTML = '';

    // Insert the leading empty cells
    for(weekday = 0; weekday < startWeekday; weekday++) {
      gridCells += '\t\t<td class="empty">&nbsp;</td>\n';
    }

    // insert the days of the month.
    for(curDay = 1; curDay <= numDays; curDay++) {
      if(curDay === dayOfMonth && this.currentDate === true) {
        // eslint-disable-next-line
        gridCells += '\t\t<td id="day' + curDay + '" class="today" headers="row' + rowCount + ' ' + this.dayNames[weekday] + '" role="gridcell" aria-selected="false">' + curDay + '</td>';
      } else {
        // eslint-disable-next-line
        gridCells += '\t\t<td id="day' + curDay + '" headers="row' + rowCount + ' ' + this.dayNames[weekday] + '" role="gridcell" aria-selected="false">' + curDay + '</td>';
      }
      if(weekday === 6 && curDay < numDays) {
        // This was the last day of the week, close it out
        // and begin a new one
        gridCells += '\t</tr>\n\t<tr id="row' + rowCount + '">\n';
        rowCount++;
        weekday = 0;
      } else {
        weekday += 1;
      }
    }

    // Insert any trailing empty cells
    for(weekday; weekday < 7; weekday++) {
      gridCells += '\t\t<td class="empty">&nbsp;</td>\n';
    }
    gridCells += '\t</tr>';
    $tbody.insertAdjacentHTML('beforeend', gridCells);
  }

  /**
    * It adds a class disable to not available days (because they are before a min date or after a max date)
    * @method _updateAvailableDays
  * */
  _updateAvailableDays() {
    // we get days only with id attributes (we dont want the empty cells)
    var days = Array.from(this.$grid.querySelectorAll('td[id]'));
    var i;
    var len = days.length;
    var day;
    // this value will be used to select the first available on the current month when the user clicks inside
    // the calendar. By default, it will be the first day of the month.
    var active = 'day1';
    for(i = 0; i < len; i++) {
      days[i].classList.remove('disabled');
    }
    if(this.maxDateMoment && this.shouldDisableNext) {
      day = this.maxDateMoment.date();
      for(i = day; i < len; i++) {
        days[i].classList.add('disabled');
      }
      active = 'day' + days[0].firstChild.nodeValue;
    }
    if(this.minDateMoment && this.shouldDisablePrev) {
      day = this.minDateMoment.date();
      for(i = 0; i < day; i++) {
        days[i].classList.add('disabled');
      }
      active = 'day' + days[i].firstChild.nodeValue;
    }
    this.$grid.setAttribute('aria-activedescendant', active);
  }

  //
  // _localeChanged() is a member function to localize the months and the days of the week using Moment.js
  //
  // @return N/A
  //
  _localeChanged(locale) {
    var localeMoment = window.moment();
    var weekdays = [];
    var months = [];
    var weekdaysAbbr = [];
    var i = 0;
    localeMoment.locale(locale);
    for(; i < 7; i++) {
      weekdays.push(localeMoment.weekday(i).format('dddd'));
      weekdaysAbbr.push(localeMoment.weekday(i).format('dd'));
    }
    for(i = 0; i < 12; i++) {
      months.push(localeMoment.month(i).format('MMMM'));
    }
    this.dayNames = weekdays;
    this.dayNamesAbbr = weekdaysAbbr;
    this.monthNames = months;
  }

  //
  // _calcNumDays() is a member function to calculate the number of days in a given month
  //
  // @return (integer) number of days
  //
  _calcNumDays(year, month) {
    return 32 - new Date(year, month, 32).getDate();
  }

  //
  // _calcstartWeekday() is a member function to calculate the day of the week the first day of a
  // month lands on
  //
  // @return (integer) number representing the day of the week (0=Sunday....6=Saturday)
  //
  _calcStartWeekday(year, month) {
    return window.moment(new Date(year, month, 1)).locale(this.locale).weekday();
  }

  //
  // _showPrevMonth() is a member function to show the previous month
  //
  // @param (offset int) offset may be used to specify an offset for setting
  //                      focus on a day the specified number of days from
  //                      the end of the month.
  // @return N/A
  //
  _showPrevMonth(offset) {
    var numDays;
    var day;

    // show the previous month
    if(this.month === 0) {
      this.month = 11;
      this.year -= 1;
    } else {
      this.month -= 1;
    }

    if(this.month !== this.curMonth || this.year !== this.curYear) {
      this.currentDate = false;
    } else {
      this.currentDate = true;
    }

    // populate the calendar grid
    this._popGrid();
    this._checkDatesRange();
    this._updateAvailableDays();
    this._bindCellsClickHandlers();


    this.$monthObj.innerHTML = this.monthNames[this.month] + ' ' + this.year;

    // if offset was specified, set focus on the last day - specified offset
    if(typeof offset !== 'undefined') {
      numDays = this._calcNumDays(this.year, this.month);
      day = 'day' + (numDays - offset);

      this.$grid.setAttribute('aria-activedescendant', day);
      this.$id.querySelector('#' + day).classList.add('focus');
      this.$id.querySelector('#' + day).setAttribute('aria-selected', 'true');
    }
  } // end _showPrevMonth()

  //
  // _showNextMonth() is a member function to show the next month
  //
  // @param (offset int) offset may be used to specify an offset for setting
  //                      focus on a day the specified number of days from
  //                      the beginning of the month.
  // @return N/A
  //
  _showNextMonth(offset) {
    var day;
    // show the next month
    if(this.month === 11) {
      this.month = 0;
      this.year += 1;
    } else {
      this.month += 1;
    }

    if(this.month !== this.curMonth || this.year !== this.curYear) {
      this.currentDate = false;
    } else {
      this.currentDate = true;
    }

    // populate the calendar grid
    this._popGrid();
    this._checkDatesRange();
    this._updateAvailableDays();
    this._bindCellsClickHandlers();

    this.$monthObj.innerHTML = this.monthNames[this.month] + ' ' + this.year;

    // if offset was specified, set focus on the first day + specified offset
    if(typeof offset !== 'undefined') {
      day = 'day' + offset;

      this.$grid.setAttribute('aria-activedescendant', day);
      this.$grid.querySelector('#' + day).classList.add('focus');
      this.$grid.querySelector('#' + day).setAttribute('aria-selected', 'true');
    }
  }

  //
  // _showPrevYear() is a member function to show the previous year
  //
  // @return N/A
  //
  _showPrevYear() {
    // decrement the year
    this.year -= 1;
    if(this.month !== this.curMonth || this.year !== this.curYear) {
      this.currentDate = false;
    } else {
      this.currentDate = true;
    }
    // populate the calendar grid
    this._popGrid();
    this._checkDatesRange();
    this._updateAvailableDays();
    this._bindCellsClickHandlers();
    this.$monthObj.innerHTML = this.monthNames[this.month] + ' ' + this.year;
  } // end _showPrevYear()

  //
  // _showNextYear() is a member function to show the next year
  //
  // @return N/A
  //
  _showNextYear() {
    // increment the year
    this.year += 1;
    if(this.month !== this.curMonth || this.year !== this.curYear) {
      this.currentDate = false;
    } else {
      this.currentDate = true;
    }
    // populate the calendar grid
    this._popGrid();
    this._checkDatesRange();
    this._updateAvailableDays();
    this._bindCellsClickHandlers();
    this.$monthObj.innerHTML = this.monthNames[this.month] + ' ' + this.year;
  }

  /**
    * It will set the selected date with format ISO 8601
    * @method _setSelectedDate
  * */
  _setSelectedDate(curDay) {
    this.set('date', window.moment([this.year, this.month, curDay.innerText]).format());
  }

  /**
    * It unbinds bind event handlers for days of the calendar
    * @method _unBindCellsClickHandlers
  * */
  _unBindCellsClickHandlers() {
    this._handleGridClick = this._handleGridClick.bind(this);
    Array.from(this.$grid.querySelectorAll('td')).forEach((cell) => {
      cell.removeEventListener('click', this._handleGridClick);
    });
  }

  /**
    * It binds bind event handlers for days of the calendar
    * @method _bindCellsClickHandlers
  * */
  _bindCellsClickHandlers() {
    this._handleGridClick = this._handleGridClick.bind(this);
    Array.from(this.$grid.querySelectorAll('td')).forEach((cell) => {
      cell.addEventListener('click', this._handleGridClick);
    });
  }

  /**
    * It binds event handlers for the widget
    * @method _bindHandlers
  * */
  _bindHandlers() {
    this.$prev.addEventListener('click', this._handlePrevClick);
    this.$next.addEventListener('click', this._handleNextClick);

    this.$prev.addEventListener('keydown', this._handlePrevKeyDown);
    this.$next.addEventListener('keydown', this._handleNextKeyDown);

    // bind grid handlers
    this.$grid.addEventListener('keydown', this._handleGridKeyDown);
    this.$grid.addEventListener('keypress', this._handleGridKeyPress);

    this.$grid.addEventListener('focus', this._handleGridFocus);
    this.$grid.addEventListener('blur', this._handleGridBlur);
  }

  /**
    * It unbinds event handlers for the widget
    * @method _checkDatesRange
  * */
  _unBindHandlers() {
    this.$prev.removeEventListener('click', this._handlePrevClick);
    this.$next.removeEventListener('click', this._handleNextClick);

    this.$prev.removeEventListener('keydown', this._handlePrevKeyDown);
    this.$next.removeEventListener('keydown', this._handleNextKeyDown);

    // bind grid handlers
    this.$grid.removeEventListener('keydown', this._handleGridKeyDown);
    this.$grid.removeEventListener('keypress', this._handleGridKeyPress);

    this.$grid.removeEventListener('focus', this._handleGridFocus);
    this.$grid.removeEventListener('blur', this._handleGridBlur);
  }

  //
  // _handlePrevClick() is a member function to process click events for the prev month button
  //
  // @input (e obj) e is the event object associated with the event
  //
  // @return (boolean) false if consuming event, true if propagating
  //
  _handlePrevClick(e) {
    if(e.ctrlKey) {
      this._showPrevYear();
    } else {
      this._showPrevMonth();
    }
    e.stopPropagation();
    return false;
  }

  //
  // _handleNextClick() is a member function to process click events for the next month button
  //
  // @input (e obj) e is the event object associated with the event
  //
  // @return (boolean) false if consuming event, true if propagating
  //
  _handleNextClick(e) {
    if(e.ctrlKey) {
      this._showNextYear();
    } else {
      this._showNextMonth();
    }
    e.stopPropagation();
    return false;
  }

  //
  // _handlePrevKeyDown() is a member function to process keydown events for the prev month button
  //
  // @input (e obj) e is the event object associated with the event
  //
  // @return (boolean) false if consuming event, true if propagating
  //
  _handlePrevKeyDown(e) {
    if(e.altKey) {
      return true;
    }
    switch (e.keyCode) {
      case this.keys.tab: {
        if(this.bModal === false || !e.shiftKey || e.ctrlKey) {
          return true;
        }

        this.$grid.focus();
        e.stopPropagation();
        return false;
      }
      case this.keys.enter:
      case this.keys.space: {
        if(e.shiftKey) {
          return true;
        }

        if(e.ctrlKey) {
          this._showPrevYear();
        } else {
          this._showPrevMonth();
        }

        e.stopPropagation();
        return false;
      }
      default:
        break;
    }

    return true;
  }

  //
  // _handleNextKeyDown() is a member function to process keydown events for the next month button
  //
  // @input (e obj) e is the event object associated with the event
  //
  // @return (boolean) false if consuming event, true if propagating
  //
  _handleNextKeyDown(e) {
    if(e.altKey) {
      return true;
    }
    switch (e.keyCode) {
      case this.keys.enter:
      case this.keys.space: {
        if(e.ctrlKey) {
          this._showNextYear();
        } else {
          this._showNextMonth();
        }

        e.stopPropagation();
        return false;
      }
      default:
        break;
    }
    return true;
  }

  //
  // _handleGridKeyDown() is a member function to process keydown events for the datepicker grid
  //
  // @input (e obj) e is the event object associated with the event
  //
  // @return (boolean) false if consuming event, true if propagating
  //
  _handleGridKeyDown(e) {
    var $rows = this.$grid.querySelector('tbody tr');
    var $curDay = this.$id.querySelector('#' + this.$grid.getAttribute('aria-activedescendant'));
    var $days = this.$grid.querySelectorAll('td:not(.empty)');
    var $daysArray = [].slice.call($days);
    var $curRow = $curDay.parentNode;

    if(e.altKey) {
      return true;
    }

    switch (e.keyCode) {
      case this.keys.tab: {
        if(this.bModal === true) {
          if(e.shiftKey) {
            this.$next.focus();
          } else {
            this.$prev.focus();
          }
          e.stopPropagation();
          return false;
        }
        break;
      }
      case this.keys.enter:
      case this.keys.space: {
        if(e.ctrlKey) {
          return true;
        }
        // update date selected
        this._setSelectedDate($curDay);

        // fall through
      }
      case this.keys.esc: {
        // dismiss the dialog box
        this._hideDlg();
        e.stopPropagation();
        return false;
      }
      case this.keys.left: {
        if(e.ctrlKey || e.shiftKey) {
          return true;
        }
        var dayIndex = $daysArray.indexOf($curDay) - 1;
        var $prevDay = null;

        if(dayIndex >= 0) {
          $prevDay = $days[dayIndex];

          $curDay.classList.remove('focus');
          $curDay.setAttribute('aria-selected', 'false');
          $prevDay.classList.add('focus')
          $prevDay.setAttribute('aria-selected', 'true');

          this.$grid.setAttribute('aria-activedescendant', $prevDay.getAttribute('id'));
        } else {
          this._showPrevMonth(0);
        }

        e.stopPropagation();
        return false;
      }
      case this.keys.right: {

        if(e.ctrlKey || e.shiftKey) {
          return true;
        }

        var dayIndex = $daysArray.indexOf($curDay) + 1;
        var $nextDay = null;

        if(dayIndex < $days.length) {
          $nextDay = $days[dayIndex];
          $curDay.classList.remove('focus');
          $curDay.setAttribute('aria-selected', 'false');
          $nextDay.classList.add('focus');
          $nextDay.setAttribute('aria-selected', 'true');

          this.$grid.setAttribute('aria-activedescendant', $nextDay.getAttribute('id'));
        } else {
          // move to the next month
          this._showNextMonth(1);
        }

        e.stopPropagation();
        return false;
      }
      case this.keys.up: {
        if(e.ctrlKey || e.shiftKey) {
          return true;
        }

        var dayIndex = $daysArray.indexOf($curDay) - 7;
        var $prevDay = null;

        if(dayIndex >= 0) {
          $prevDay = $days[dayIndex];

          $curDay.classList.remove('focus');
          $curDay.setAttribute('aria-selected', 'false');
          $prevDay.classList.add('focus');
          $prevDay.setAttribute('aria-selected', 'true');

          this.$grid.setAttribute('aria-activedescendant', $prevDay.getAttribute('id'));
        } else {
          // move to appropriate day in previous month
          dayIndex = 6 - $daysArray.indexOf($curDay);

          this._showPrevMonth(dayIndex);
        }

        e.stopPropagation();
        return false;
      }
      case this.keys.down: {
        if(e.ctrlKey || e.shiftKey) {
          return true;
        }

        var dayIndex = $daysArray.indexOf($curDay) + 7;
        var $prevDay = null;

        if(dayIndex < $days.length) {
          $prevDay = $days[dayIndex];

          $curDay.classList.remove('focus');
          $curDay.setAttribute('aria-selected', 'false');
          $prevDay.classList.add('focus');
          $prevDay.setAttribute('aria-selected', 'true');

          this.$grid.setAttribute('aria-activedescendant', $prevDay.getAttribute('id'));
        } else {
          // move to appropriate day in next month
          dayIndex = 8 - ($days.length - $daysArray.indexOf($curDay));

          this._showNextMonth(dayIndex);
        }

        e.stopPropagation();
        return false;
      }
      case this.keys.pageup: {
        var active = this.$grid.getAttribute('aria-activedescendant');


        if(e.shiftKey) {
          return true;
        }


        if(e.ctrlKey) {
          this._showPrevYear();
        } else {
          this._showPrevMonth();
        }

        if(typeof this.$id.querySelector('#' + active).setAttribute('id') === 'undefined') {
          var lastDay = 'day' + this._calcNumDays(this.year, this.month);
          this.$id.querySelector('#' + lastDay).classList.add('focus');
          this.$id.querySelector('#' + lastDay).setAttribute('aria-selected', 'true');
        } else {
          this.$id.querySelector('#' + active).classList.add('focus');
          this.$id.querySelector('#' + active).setAttribute('aria-selected', 'true');
        }

        e.stopPropagation();
        return false;
      }
      case this.keys.pagedown: {
        var active = this.$grid.getAttribute('aria-activedescendant');
        if(e.shiftKey) {
          return true;
        }
        if(e.ctrlKey) {
          this._showNextYear();
        } else {
          this._showNextMonth();
        }
        if(this.$id.querySelector('#' + active).setAttribute('id') == undefined) {
          var lastDay = 'day' + this._calcNumDays(this.year, this.month);
          this.$id.querySelector('#' + lastDay).classList.add('focus');
          this.$id.querySelector('#' + lastDay).setAttribute('aria-selected', 'true');
        } else {
          this.$id.querySelector('#' + active).classList.add('focus');
          this.$id.querySelector('#' + active).setAttribute('aria-selected', 'true');
        }

        e.stopPropagation();
        return false;
      }
      case this.keys.home: {
        if(e.ctrlKey || e.shiftKey) {
          return true;
        }
        $curDay.classList.remove('focus');
        $curDay.setAttribute('aria-selected', 'false');

        this.$id.querySelector('#day1').classList.add('focus')
        this.$id.querySelector('#day1').setAttribute('aria-selected', 'true');

        this.$grid.setAttribute('aria-activedescendant', 'day1');

        e.stopPropagation();
        return false;
      }
      case this.keys.end: {
        if(e.ctrlKey || e.shiftKey) {
          return true;
        }

        var lastDay = 'day' + this._calcNumDays(this.year, this.month);

        $curDay.classList.remove('focus')
        $curDay.setAttribute('aria-selected', 'false');

        this.$id.querySelector('#' + lastDay).classList.add('focus');
        this.$id.querySelector('#' + lastDay).setAttribute('aria-selected', 'true');

        this.$grid.setAttribute('aria-activedescendant', lastDay);

        e.stopPropagation();
        return false;
      }
      default:
        break;
    }
    return true;
  }

  //
  // _handleGridKeyPress() is a member function to consume keypress events for browsers that
  // use keypress to scroll the screen and manipulate tabs
  //
  // @input (e obj) e is the event object associated with the event
  //
  // @return (boolean) false if consuming event, true if propagating
  //
  _handleGridKeyPress(e) {
    if(e.altKey) {
      return true;
    }

    switch (e.keyCode) {
      case this.keys.tab:
      case this.keys.enter:
      case this.keys.space:
      case this.keys.esc:
      case this.keys.left:
      case this.keys.right:
      case this.keys.up:
      case this.keys.down:
      case this.keys.pageup:
      case this.keys.pagedown:
      case this.keys.home:
      case this.keys.end: {
        e.stopPropagation();
        return false;
      }
      default:
        break;
    }

    return true;
  }

  //
  // _handleGridClick() is a member function to process mouse click events for the datepicker grid
  //
  // @input (id obj) e is the id of the object triggering the event
  //
  // @input (e obj) e is the event object associated with the event
  //
  // @return (boolean) false if consuming event, true if propagating
  //
  _handleGridClick(e) {
    var $cell = e.target;
    if($cell.classList.contains('empty') || $cell.classList.contains('disabled')) {
      return true;
    }

    this.$grid.querySelector('.focus').classList.remove('focus');
    this.$grid.setAttribute('aria-selected', 'false');
    $cell.classList.add('focus');
    $cell.setAttribute('aria-selected', 'true');
    this.$grid.setAttribute('aria-activedescendant', $cell.getAttribute('id'));

    var $curDay = this.$id.querySelector('#' + this.$grid.getAttribute('aria-activedescendant'));

    // update date selected
    this._setSelectedDate($curDay);

    // dismiss the dialog box
    this._hideDlg();

    e.stopPropagation();
    return false;
  }

  //
  // _handleGridFocus() is a member function to process focus events for the datepicker grid
  //
  // @input (e obj) e is the event object associated with the event
  //
  // @return (boolean) true
  //
  _handleGridFocus() {
    var active = this.$grid.getAttribute('aria-activedescendant');

    if(typeof this.$grid.querySelector('#' + active).getAttribute('id') === 'undefined') {
      var lastDay = 'day' + this._calcNumDays(this.year, this.month);
      this.$grid.querySelector('#' + lastDay).classList.add('focus');
      this.$grid.querySelector('#' + lastDay).setAttribute('aria-selected', 'true');
    } else {
      this.$grid.querySelector('#' + active).classList.add('focus');
      this.$grid.querySelector('#' + active).setAttribute('aria-selected', 'true');
    }
    return true;
  }

  //
  // _handleGridBlur() is a member function to process blur events for the datepicker grid
  //
  // @input (e obj) e is the event object associated with the event
  //
  // @return (boolean) true
  //
  _handleGridBlur() {
    this.$id.querySelector('#' + this.$grid.getAttribute('aria-activedescendant')).classList.remove('focus');
    // eslint-disable-next-line
    this.$id.querySelector('#' + this.$grid.getAttribute('aria-activedescendant')).setAttribute('aria-selected', 'false');
    return true;
  }

  //
  // showDlg() is a member function to show the datepicker and give it focus. This function is only called if
  // the datepicker is used in modal dialog mode.
  //
  // @return N/A
  //
  showDlg() {
    // Bind an event listener to the document to capture all mouse events to make dialog modal
    document.addEventListener('click', () => this._handlerShowDlg);
    document.addEventListener('mousedown', () => this._handlerShowDlg);
    document.addEventListener('mouseup', () => this._handlerShowDlg);
    document.addEventListener('mousemove', () => this._handlerShowDlg);
    document.addEventListener('mouseover', () => this._handlerShowDlg);

    this._checkDatesRange();
    this._updateAvailableDays();

    // show the dialog
    this.$id.setAttribute('aria-hidden', 'false');

    this.$grid.focus();
  } // end showDlg()

  //
  // _hideDlg() is a member function to hide the datepicker and remove focus. This function is only called if
  // the datepicker is used in modal dialog mode.
  //
  // @return N/A
  //
  _hideDlg() {
    // unbind the modal event sinks
    document.removeEventListener('click', this._handlerShowDlg);
    document.removeEventListener('mousedown', this._handlerShowDlg);
    document.removeEventListener('mouseup', this._handlerShowDlg);
    document.removeEventListener('mousemove', this._handlerShowDlg);
    document.removeEventListener('mouseover', this._handlerShowDlg);

    // hide the dialog
    this.$id.setAttribute('aria-hidden', 'true');

    // set focus on the focus target
    // TODO
  }
}

window.customElements.define(PolymerOpenajaxDatePicker.is, PolymerOpenajaxDatePicker);
