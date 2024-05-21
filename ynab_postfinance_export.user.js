// ==UserScript==
// @name        Postfinance CSV Export
// @namespace   Kagemaru
// @description Export Postfinance Assets
// @match       https://www.postfinance.ch/ap/ba/ob/html/finance/assets/movements-overview
// @version     4.0.0
// @grant       none
// @downloadURL https://github.com/Kagemaru/ynab_postfinance_export/raw/master/ynab_postfinance_export.user.js
// @updateURL   https://github.com/Kagemaru/ynab_postfinance_export/raw/master/ynab_postfinance_export.user.js
// @run-at      context-menu
// ==/UserScript==
// Function definitions


class PFExport {
  filename;
  csv;

  constructor(filename) {
    this.filename = filename || this.default_filename();
  }

  /* Public API */
  create() {
    this.csv = PFCSV.file()

    return this.csv
  }

  download() {
    if (this.csv == null) {
      console.log("csv is empty, please use create() first.")
      return false;
    }

    // create a temporary download link
    let input = document.createElement("a");
    input.setAttribute('href', 'data:text/csv;charset=UTF-8,' + encodeURIComponent(this.csv));
    input.setAttribute('download', this.filename);
    input.style.display = 'none';

    // ...and click it to trigger the download
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }

  default_filename() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    return "ynab-" + year + "-" + month + "-" + day + ".csv";
  }
}

class PFPage {
  static table() { return this.selectByCY('table', 'movements-table') }
  static rows() { return this.table().querySelectorAll('tbody > tr') }
  static fields(row) {
    return {
      date: row.querySelector('[data-cy="date"] time').dateTime,
      shortText: row.querySelector('[data-cy="shortText"]')?.querySelector('.cell__value')?.textContent || null,
      credit: row.querySelector('[data-cy="credit"] [data-cy-fpui-amount]')?.attributes['fpa-amount']?.textContent || null,
      debit: row.querySelector('[data-cy="debit"] [data-cy-fpui-amount]')?.attributes['fpa-amount']?.textContent || null,
      valuta: row.querySelector('[data-cy="valuta"] time').dateTime,
      balance: row.querySelector('[data-cy="balance"] [data-cy-fpui-amount]')?.attributes["fpa-amount"]?.textContent || null
    };
  }

  static selectByCY(element, cy_name) {
    return document.querySelector(`${element}[data-cy='${cy_name}']`);
  }
}

class PFCSV {
  static file() {
    const header = 'Date,Payee,Memo,Outflow,Inflow';
    const rows = [...PFPage.rows()]
    const mapping = rows.map((row) => { return this.fields(row) });
    return [header, ...mapping].join("\n")
  }

  static fields(pf_fields) {
    const fields = PFPage.fields(pf_fields)

    const valuta = `"${fields.valuta}"`
    const payee = `"${fields.shortText.replace(/\"/gi, '').replace(/\r\n?|\n/gi, ' ')}"`
    //const category = '""'
    const memo = '""'
    const outflow = fields.debit?.replace(/-(.*)/, '$1')
    const inflow = fields.credit

    return [valuta, payee, memo, outflow, inflow].join(', ');
  }
}

(function () {
  'use strict';
  const pf_export = new PFExport()
  pf_export.create()
  pf_export.download()
})();
