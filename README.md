# \<polymer-openajax-datepicker\>

Polymer component based on the [Date Picker from Open Ajax Alliance](http://www.oaa-accessibility.org/examplep/datepicker1/).

```html
  <label id="date_label" for="date">Date</label>:
  <input id="date" type="text" value="[[datepickerValue]]" />
  <paper-button onclick="datePicker.showDlg()">Select Date...</paper-button>
  <polymer-openajax-datepicker id="datePicker" date="{{datepickerValue}}"></polymer-openajax-datepicker>
```

## Keyboard support


+ Left: Move focus to the previous day. Will move to the last day of the previous month, if the current day is the first day of a month.
+ Right: Move focus to the next day. Will move to the first day of the following month, if the current day is the last day of a month.
+ Up: Move focus to the same day of the previous week. Will wrap to the appropriate day in the previous month.
+ Down: Move focus to the same day of the following week. Will wrap to the appropriate day in the following month.
+ PgUp: Move focus to the same date of the previous month. If that date does not exist, focus is placed on the last day of the month.
+ PgUp: Move focus to the same date of the following month. If that date does not exist, focus is placed on the last day of the month.
+ Ctrl+PgUp: Move focus to the same date of the previous year. If that date does not exist (e.g leap year), focus is placed on the last day of the month.
+ Ctrl+PgDn: Move focus to the same date of the following year. If that date does not exist (e.g leap year), focus is placed on the last day of the month.
+ Home: Move to the first day of the month.
+ End: Move to the last day of the month
+ Tab: Navigate between calander grid and previous/next selection buttons
+ Enter/Space: Select date

## TODO

+ Add i18n and l10n
+ Add tests
+ Add more custom CSS properties

## Install the Polymer-CLI

First, make sure you have the [Polymer CLI](https://www.npmjs.com/package/polymer-cli) installed. Then run `polymer serve` to serve your element locally.

## Viewing Your Element

```
$ polymer serve
```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request

## History

## License

[MIT License](https://opensource.org/licenses/MIT)