class Calculator {
    constructor(selector) {
        this.element = document.querySelector(selector);
        this.createElement(JSON.parse(this.element.dataset.setup));
        this.styles = window.getComputedStyle(this.element);

        this.labels = document.querySelectorAll(selector+' label');
        this.inputs = document.querySelectorAll(selector+' input, '+ selector +' select');

        this.defaultFontSize = parseInt(this.styles.getPropertyValue("font-size"));
        this.labelFontSize = parseInt(window.getComputedStyle(this.element.querySelector('label')).getPropertyValue("font-size"));
        this.inputFontSize = parseInt(window.getComputedStyle(this.element.querySelector('input')).getPropertyValue("font-size"));

        this.amount_field = this.element.querySelector('input#amount');
        this.currency_field = this.element.querySelector('select#currency');
        this.term_field = this.element.querySelector('input#term');
        this.time_field = this.element.querySelector('select#time');
        this.rate_field = this.element.querySelector('input#interest-rate');

        this.month_option = document.querySelector('select#time option[value=month]');
        this.year_option = document.querySelector('select#time option[value=year]');

        this.toggleLabel = this.element.querySelector('.payment-type .label');
        this.annuity_option = this.element.querySelector('.annuity');
        this.differentiated_option = this.element.querySelector('.differentiated');

        this.period_field = this.element.querySelector('select#period');
        
        this.monthly_option = this.period_field.querySelector('option[value=monthly]');
        this.quarterly_option = this.period_field.querySelector('option[value=quarterly]');
        this.annually_option = this.period_field.querySelector('option[value=annually]');

        this.dateField = this.element.querySelector('#first-payment-date');
        let today = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];
        this.dateField.min = today;
        this.dateField.value = today;

        this.element.querySelector('button.calculate').addEventListener('click', (event) => {this.calculate();});
        
        this.modal = document.querySelector('.calc-modal');
        this.modal.querySelector('.calc-modal-close').addEventListener('click', (event) => {this.closeModal();});
        this.table = this.modal.querySelector('.table__body .table__rows');

        this.differentiated_option.addEventListener('click', (event) => {this.differentiatedOn();});
        this.annuity_option.addEventListener('click', (event) => {this.annuityOn();});

        this.amount_field.addEventListener('input', (event) => {
            const value = event.target.value.replace(/\D/g, '');
            event.target.value = Number(value).toLocaleString();     
        });

        this.amount_field.addEventListener('blur', (event) => {this.unfocusTextNumber(event);});
        this.term_field.addEventListener('blur', (event) => {this.unfocusTextNumber(event);});
        this.rate_field.addEventListener('blur', (event) => {this.unfocusTextNumber(event);});

        this.term_field.addEventListener("input", (event) => {this.periodControl();});
        this.term_field.addEventListener("blur", (event) => {this.periodControl();});
        this.time_field.addEventListener("change", (event) => {this.periodControl();});

        this.modal.querySelector('.downloadPDF').addEventListener("click", () => {        
            this.downloadPDF()
        });
    }
    resize() {
        let calcWidth = this.element.offsetWidth;
        
        if (calcWidth<500) {
            let kf = 1-(500-calcWidth)/500;
            let fontSize = this.defaultFontSize * kf;

            this.differentiated_option.style.fontSize = fontSize + 'px';
            this.annuity_option.style.fontSize = fontSize + 'px';
            this.toggleLabel.style.fontSize = fontSize + 'px';

            for (let i = 0; i < this.labels.length; i++) {
                this.labels[i].style.fontSize = this.labelFontSize * kf + 'px';
            }

            for (let i = 0; i < this.inputs.length; i++) {
                this.inputs[i].style.fontSize = this.inputFontSize * kf + 'px';
            }
        }
    }
    parseNumber (string) {
        return parseInt(string.replace(/\D/g,''));
    }
    formatNumber (number) {
        return Number(Math.floor(number).toString()).toLocaleString() + ',' + number.toFixed(2).toString().split('.')[1];
    }
    formateDate(date) {
        const yyyy = date.getFullYear();
        let mm = date.getMonth() + 1;
        let dd = date.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        return dd + '.' + mm + '.' + yyyy;
    }
    unfocusTextNumber(event) {
        let value = this.parseNumber(event.target.value) || 0;

        if (this.parseNumber(event.target.min)>value) {
            event.target.value = event.target.min;
        }
    }
    annuityOn(){
        this.annuity_option.classList.add('active');
        this.differentiated_option.classList.remove('active');
    }
    differentiatedOn(){
        this.annuity_option.classList.remove('active');
        this.differentiated_option.classList.add('active');
    }
    calculate() {
        let amount = this.parseNumber(this.amount_field.value);
        let term = this.parseNumber(this.term_field.value);
        let time = this.time_field.value;
        let period = this.period_field.value;
        let rate = this.rate_field.value;
        let currency = this.currency_field.options[this.currency_field.selectedIndex].text;
        let dateObject = new Date(document.querySelector('#first-payment-date').value);

        let rest = amount;
        this.table.innerHTML = `<div class="table__row"> <div class="table__cell">${this.formateDate(dateObject)}</div> <div class="table__cell">0,00</div> <div class="table__cell">0,00</div> <div class="table__cell">0,00</div> <div class="table__cell">${this.formatNumber(rest)}</div> </div>`;

        let r;
        let n;
        let payment;
        let body;
        let pr;

        if (period == 'monthly'){
            r = rate / 12 / 100;

            n = term;
            if (time == 'year') {
                n = term * 12;
            }
        }
        else if (period == 'quarterly'){
            r = rate / 4 / 100;

            n = term / 3;
            if (time == 'year') {
                n = term * 4;
            }
        }
        else if (period == 'annually'){
            r = rate / 100;

            n = term / 12;
            if (time == 'year') {
                n = term;
            }
        }

        this.rows = [[ { text: 'Дата', bold: true }, { text: 'Платеж', bold: true }, { text: 'Проценты', bold: true }, { text: 'Тело кредита', bold: true }, { text: 'Остаток', bold: true }]];

        if (this.annuity_option.classList.contains('active')) {
            payment = amount * ((r * (1 + r)**n) / ((1 + r)**n - 1));
            
            document.querySelector('.calc-modal-sum-value').textContent = this.formatNumber(payment * n) + ' ' + currency;
            document.querySelector('.calc-modal-over-value').textContent = this.formatNumber(payment * n - amount) + ' ' + currency;

            for (let i = 0; i < n; i++){
                dateObject.setMonth(dateObject.getMonth() + 1 * {'monthly': 1, 'quarterly': 3, 'annually': 12}[period]);
                body = payment - rest * r;
                pr = payment - body;
                rest -= body;

                if (n-1==i){
                    rest=0;
                }

                let date = this.formateDate(dateObject);

                this.rows.push([date, this.formatNumber(payment), this.formatNumber(pr), this.formatNumber(body), this.formatNumber(rest)])
                this.table.innerHTML += `<div class="table__row"> <div class="table__cell">${date}</div> <div class="table__cell">${this.formatNumber(payment)}</div> <div class="table__cell">${this.formatNumber(pr)}</div> <div class="table__cell">${this.formatNumber(body)}</div> <div class="table__cell">${this.formatNumber(rest)}</div> </div>`;
            }
        }
        else if (this.differentiated_option.classList.contains('active')) {
            let sum = 0
            for (let i = 0; i < n; i++){
                dateObject.setMonth(dateObject.getMonth() + 1 * {'monthly': 1, 'quarterly': 3, 'annually': 12}[period]);

                payment = amount / n + (amount - (amount * i / n)) * r;
                body = amount / n;
                pr = payment - body;

                sum += payment;
                rest -= body;

                if (n-1==i){
                    rest=0;
                }

                let date = this.formateDate(dateObject);

                this.rows.push([date, this.formatNumber(payment), this.formatNumber(pr), this.formatNumber(body), this.formatNumber(rest)])
                this.table.innerHTML += `<div class="table__row"> <div class="table__cell">${date}</div> <div class="table__cell">${this.formatNumber(payment)}</div> <div class="table__cell">${this.formatNumber(pr)}</div> <div class="table__cell">${this.formatNumber(body)}</div> <div class="table__cell">${this.formatNumber(rest)}</div> </div>`;
            }

            document.querySelector('.calc-modal-sum-value').textContent = this.formatNumber(sum) + ' ' + currency;
            document.querySelector('.calc-modal-over-value').textContent = this.formatNumber(sum - amount) + ' ' + currency;
        }

        this.modal.style.display = 'block';
    }
    downloadPDF(){
        var docDefinition = {
            content: [
                {
                    alignment: 'center',
                    text: 'График погашения кредита',
                    fontSize: 16,
                    bold: true,
                    margin: [0, 20],
                },
                {
                    layout: 'lightHorizontalLines', // optional
                    table: {
                        headerRows: 1,
                        widths: [ '20%', '20%', '20%', '20%', '20%' ],
            
                        body: this.rows
                    }
                }
            ]
        };
        var pdf = createPdf(docDefinition);
        pdf.download('PDF_document.pdf');
    }
    closeModal() {
        this.modal.style.display = 'none';
    }
    periodControl() {
        let term_value = this.term_field.value;
        let time_value = this.time_field.value;

        if (term_value < 3 && time_value == 'month') {
            this.monthly_option.disabled = false;
            this.quarterly_option.disabled = true;
            this.annually_option.disabled = true;
            
            this.period_field.value = 'monthly';
        }
        else if (term_value < 12 && time_value == 'month') {
            this.monthly_option.disabled = false;
            this.quarterly_option.disabled = false;
            this.annually_option.disabled = true;

            if (period.value=='annually') {
                this.period_field.value = 'monthly';
            }
        }
        else {
            this.monthly_option.disabled = false;
            this.quarterly_option.disabled = false;
            this.annually_option.disabled = false;
        }

        let end = parseInt(term_value)%10;

        if (end == 0 || 4<end || (10 < term_value && term_value < 20) ) {
            this.month_option.textContent = 'месяцев';
            this.year_option.textContent = 'лет';
        }
        else if (end == 1){
            this.month_option.textContent = 'месяц';
            this.year_option.textContent = 'год';
        }
        else if (end == 2 || end == 3 || end == 4){
            this.month_option.textContent = 'месяца';
            this.year_option.textContent = 'года';
        }

    }
    createElement({color = '#76a2a0', secondary_color = '#618e8c', defaultAmount = 25000, minAmount = 10000, minRate = 1, annuityPayment = true, differentiatedPayment = true, currencies = {rub: '₽', eur: '€', usd: '$'} } = {}) {
        if (this.element.innerHTML.length > 0) {
            return console.log('element is already instance');
        }
        let currency = '';
        let paymentType;

        for (const [key, value] of Object.entries(currencies)) {
            currency += `<option value="${key}">${value}</option>`
        }

        if (annuityPayment == true && differentiatedPayment == true){
            paymentType =
                `<div class="payment-type">
                    <div class="label">Тип платежей</div>

                    <div class="payment-type-toggle">
                        <div class="annuity active"><span>Аннуитетный</span></div>
                        <div class="differentiated"><span>Дифференцированный</span></div>
                    </div>
                </div>`
        }
        else if (annuityPayment == false && differentiatedPayment == false) {
            throw new Error("Chose one of annuityPayment/differentiatedPayment");
        }
        else {
            let annuity_active = '';
            let differentiated_active = '';

            if (annuityPayment) {
                annuity_active = 'active';
            }
            else if (differentiatedPayment) {
                differentiated_active = 'active';
            }

            paymentType = 
                `<div class="payment-type" style="display: none">
                    <div class="label">Тип платежей</div>

                    <div class="payment-type-toggle">
                        <div class="annuity ${annuity_active}"><span>Аннуитетный</span></div>
                        <div class="differentiated ${differentiated_active}"><span>Дифференцированный</span></div>
                    </div>
                </div>
                `
        }

        

        this.element.innerHTML = `<div class="credit-input-currency-amount">
            <div class="credit-input amount">
                <label for="amount">Сумма кредита</label>
                <input type="text" id="amount" name="amount" maxlength="15" value="${Number(defaultAmount).toLocaleString()}" min="${Number(minAmount).toLocaleString()}">
            </div>
            <div class="credit-input currency" style="max-width: 30%;">
                <select id="currency" name="currency">${currency}</select>
            </div>
        </div>

        <div class="credit-input-time-term">
            <div class="credit-input term">
                <label for="term">Срок кредита</label>
                <input type="text" id="term" name="term" maxlength="3" value="12" min="1">
            </div>
            <div class="credit-input time">
                <select name="time" id="time">
                    <option value="month">месяц</option>
                    <option value="year">год</option>
                </select>
            </div>
        </div>

        <div class="credit-input-period">
            <div class="credit-input period">
                <label for="period">Периодичность погашения</label>
                <select name="period" id="period">
                    <option value="monthly">Ежемесячно</option>
                    <option value="quarterly">Ежеквартально</option>
                    <option value="annually">Ежегодно</option>
                </select>
            </div>
        </div>

        <div class="credit-input-interest-rate">
            <div class="credit-input interest-rate">
                <label for="term">Процентная ставка, % годовых</label>
                <input type="number" id="interest-rate" name="interest-rate" step="0.1" value="5.0" min="${minRate}">
            </div>
        </div>

        <div class="credit-input-first-payment-date">
            <div class="credit-input first-payment-date">
                <label for="first-payment-date">Начало выплат</label>
                <input type="date" id="first-payment-date" name="first-payment-date" max="2030-12-31"/>
            </div>
        </div>
        
        ${paymentType}

        <button class="calculate">Рассчитать</button>
        
        
        <style>
        :root {
            --calc-color: ${color};
            --secondary-calc-color: ${secondary_color};
        
            --light-color: white;
            --light-secondary-color: #f5f5f5;
            --muted-color: #999999;
        }
        </style>`;
    }
}

function createModal(){
    if (document.body.querySelectorAll('.calc-modal').length > 0) {
        return console.log('modal is already instance');
    }
    document.body.innerHTML += `
        <div class="calc-modal">
            <div class="calc-modal-content">
                <span class="calc-modal-close">&times;</span>
            
                <div class="calc-modal-title">Результаты расчета</div>

                <div class="calc-modal-results">
                    <div class="calc-modal-sum">
                        <div class="calc-modal-sum-title">Всего выплат</div>
                        <div class="calc-modal-sum-value">000</div>
                    </div>
                    <div class="calc-modal-over">
                        <div class="calc-modal-over-title">Переплата</div>
                        <div class="calc-modal-over-value">0</div>
                    </div>
                    <div class="calc-modal-total"></div>
                    <button class="downloadPDF">Скачать PDF</button>
                </div>

                <div class="table-container">
                    <div class="modal-table">
                        <div class="table__header">
                            <div class="table__row">
                                <div class="table__cell">Дата</div>
                                <div class="table__cell">Платеж</div>
                                <div class="table__cell">Проценты</div>
                                <div class="table__cell">Тело кредита</div>
                                <div class="table__cell">Остаток</div>
                            </div>
                        </div>
                        <div class="table__body">
                            <div class="table__rows"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div> `;
}

createModal();

var calc = new Calculator('.credit-calc');

window.addEventListener('resize', (event) => { calc.resize(); })
window.addEventListener('load', (event) => { calc.resize(); })
