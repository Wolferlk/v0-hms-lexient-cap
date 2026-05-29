'use client';
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DayOutManagement;
var react_1 = require("react");
var button_1 = require("@/components/ui/button");
var input_1 = require("@/components/ui/input");
var label_1 = require("@/components/ui/label");
var tabs_1 = require("@/components/ui/tabs");
var select_1 = require("@/components/ui/select");
var dialog_1 = require("@/components/ui/dialog");
var sonner_1 = require("sonner");
var date_fns_1 = require("date-fns");
var lucide_react_1 = require("lucide-react");
// ── Print ─────────────────────────────────────────────────────────────────────
function printBill(b, type, hotel) {
    var _a, _b, _c, _d, _e, _f;
    if (hotel === void 0) { hotel = 'Lexient Hotel'; }
    var qrUrl = "".concat(window.location.origin, "/day-out-bill/").concat(b._id);
    var title = type === 'group' ? b.groupName : ((_a = b.packageId) === null || _a === void 0 ? void 0 : _a.name) || 'Boat Ride';
    var people = type === 'group' ? b.numberOfPeople : b.numberOfPassengers;
    var totalAmount = (_b = b.totalAmount) !== null && _b !== void 0 ? _b : 0;
    var advancePaid = (_c = b.advancePaid) !== null && _c !== void 0 ? _c : 0;
    var balance = totalAmount - advancePaid;
    var html = "<!DOCTYPE html><html><head><title>Day-out Bill</title>\n  <style>\n    body{font-family:'Courier New',monospace;font-size:11px;width:300px;margin:0 auto;padding:8px}\n    h2{text-align:center;font-size:15px;margin:0} .c{text-align:center}\n    hr{border:none;border-top:1px dashed #000;margin:6px 0}\n    table{width:100%;border-collapse:collapse} td{padding:2px 0} .r{text-align:right}\n    .tb td{font-weight:bold;font-size:13px} img.qr{display:block;margin:8px auto;width:110px}\n    @media print{body{margin:0}}\n  </style></head><body>\n  <h2>".concat(hotel, "</h2><p class=\"c\">Day-out Bill</p><hr/>\n  <p><b>").concat(title, "</b></p>\n  <p>Date: <b>").concat((0, date_fns_1.format)(new Date(b.bookingDate), 'dd MMM yyyy'), "</b></p>\n  ").concat(type === 'boat' ? "<p>Departure: ".concat(b.departureTime, "</p>") : '', "\n  <p>People: ").concat(people, " \u00B7 Status: <b>").concat(b.status.toUpperCase(), "</b></p>\n  <hr/>\n  <table>\n    <tr><td>Package</td><td class=\"r\">Rs.").concat(((_d = b.totalPrice) !== null && _d !== void 0 ? _d : 0).toFixed(2), "</td></tr>\n    ").concat(((_e = b.additionalItems) !== null && _e !== void 0 ? _e : []).map(function (i) { var _a; return "<tr><td>".concat(i.name, " \u00D7").concat(i.quantity, "</td><td class=\"r\">Rs.").concat(((_a = i.total) !== null && _a !== void 0 ? _a : 0).toFixed(2), "</td></tr>"); }).join(''), "\n  </table><hr/>\n  <table>\n    <tr class=\"tb\"><td>TOTAL</td><td class=\"r\">Rs.").concat(totalAmount.toFixed(2), "</td></tr>\n    <tr><td>Paid</td><td class=\"r\">Rs.").concat(advancePaid.toFixed(2), "</td></tr>\n    <tr class=\"tb\"><td>BALANCE DUE</td><td class=\"r\">Rs.").concat(balance.toFixed(2), "</td></tr>\n  </table><hr/>\n  ").concat(((_f = b.payments) !== null && _f !== void 0 ? _f : []).length > 0 ? "<p><b>Payments:</b></p>".concat(b.payments.map(function (p) { return "<p>".concat(p.method, " \u2014 Rs.").concat(p.amount, " (").concat((0, date_fns_1.format)(new Date(p.date), 'MMM dd'), ")</p>"); }).join(''), "<hr/>") : '', "\n  <p class=\"c\" style=\"font-size:10px\">Scan QR to view bill online</p>\n  <img class=\"qr\" src=\"https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=").concat(encodeURIComponent(qrUrl), "\" />\n  <p class=\"c\" style=\"font-size:9px\">Thank you for choosing ").concat(hotel, "!</p>\n  </body></html>");
    var w = window.open('', '_blank', 'width=420,height=640');
    if (w) {
        w.document.write(html);
        w.document.close();
        w.focus();
        w.print();
    }
}
// ── Badge ─────────────────────────────────────────────────────────────────────
var badge = function (s) {
    var _a;
    return ((_a = {
        pending: 'bg-yellow-100 text-yellow-700',
        confirmed: 'bg-green-100 text-green-700',
        completed: 'bg-blue-100 text-blue-700',
        cancelled: 'bg-red-100 text-red-500',
        partial: 'bg-orange-100 text-orange-700',
        paid: 'bg-emerald-100 text-emerald-700',
    }[s]) !== null && _a !== void 0 ? _a : 'bg-gray-100 text-gray-600');
};
// ── Component ─────────────────────────────────────────────────────────────────
function DayOutManagement() {
    var _this = this;
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    var _t = (0, react_1.useState)('groupBookings'), activeTab = _t[0], setActiveTab = _t[1];
    var _u = (0, react_1.useState)(true), loading = _u[0], setLoading = _u[1];
    var _v = (0, react_1.useState)([]), dayOutPackages = _v[0], setDayOutPackages = _v[1];
    var _w = (0, react_1.useState)([]), boatPackages = _w[0], setBoatPackages = _w[1];
    var _x = (0, react_1.useState)([]), groupBookings = _x[0], setGroupBookings = _x[1];
    var _y = (0, react_1.useState)([]), boatBookings = _y[0], setBoatBookings = _y[1];
    var _z = (0, react_1.useState)(''), search = _z[0], setSearch = _z[1];
    var _0 = (0, react_1.useState)('all'), statusFilter = _0[0], setStatusFilter = _0[1];
    // ── Package dialogs ──────────────────────────────────────────────────────────
    var _1 = (0, react_1.useState)(false), pkgDialog = _1[0], setPkgDialog = _1[1];
    var _2 = (0, react_1.useState)(null), editingPkg = _2[0], setEditingPkg = _2[1];
    var _3 = (0, react_1.useState)({
        name: '', description: '', price: 0, capacity: 100, duration: 8,
        maxGroupSize: 50, minGroupSize: 10, pricePerPerson: 0, discountPercentage: 0,
        activities: [], inclusions: [], amenities: [],
    }), pkgForm = _3[0], setPkgForm = _3[1];
    var _4 = (0, react_1.useState)(false), boatPkgDialog = _4[0], setBoatPkgDialog = _4[1];
    var _5 = (0, react_1.useState)(null), editingBoatPkg = _5[0], setEditingBoatPkg = _5[1];
    var _6 = (0, react_1.useState)({
        name: '', description: '', boatType: 'speed_boat', capacity: 10,
        price: 0, pricePerPerson: 0, duration: 60, departureTime: '',
        routeDescription: '', safetyRating: 5, mealIncluded: false, lifeJacketsProvided: true,
    }), boatPkgForm = _6[0], setBoatPkgForm = _6[1];
    // ── Booking create dialogs ───────────────────────────────────────────────────
    var _7 = (0, react_1.useState)(false), createGroupDialog = _7[0], setCreateGroupDialog = _7[1];
    var _8 = (0, react_1.useState)(false), createBoatDialog = _8[0], setCreateBoatDialog = _8[1];
    var _9 = (0, react_1.useState)({
        packageId: '', groupName: '', bookingDate: '', numberOfPeople: 10,
        contactName: '', contactPhone: '', contactEmail: '',
        specialRequests: '', advanceAmount: 0, paymentMethod: 'cash',
    }), groupForm = _9[0], setGroupForm = _9[1];
    var _10 = (0, react_1.useState)({
        packageId: '', bookingDate: '', departureTime: '', numberOfPassengers: 1,
        contactName: '', contactPhone: '', contactEmail: '',
        specialRequests: '', advanceAmount: 0, paymentMethod: 'cash',
    }), boatForm = _10[0], setBoatForm = _10[1];
    // ── Detail panel ─────────────────────────────────────────────────────────────
    var _11 = (0, react_1.useState)(null), selectedBooking = _11[0], setSelectedBooking = _11[1];
    var _12 = (0, react_1.useState)('group'), selectedType = _12[0], setSelectedType = _12[1];
    var _13 = (0, react_1.useState)(false), detailPanel = _13[0], setDetailPanel = _13[1];
    // ── Payment dialog ───────────────────────────────────────────────────────────
    var _14 = (0, react_1.useState)(false), payDialog = _14[0], setPayDialog = _14[1];
    var _15 = (0, react_1.useState)('pay'), payAction = _15[0], setPayAction = _15[1];
    var _16 = (0, react_1.useState)(''), payAmount = _16[0], setPayAmount = _16[1];
    var _17 = (0, react_1.useState)('cash'), payMethod = _17[0], setPayMethod = _17[1];
    var _18 = (0, react_1.useState)(''), payNotes = _18[0], setPayNotes = _18[1];
    // ── Item dialog ──────────────────────────────────────────────────────────────
    var _19 = (0, react_1.useState)(false), itemDialog = _19[0], setItemDialog = _19[1];
    var _20 = (0, react_1.useState)({ name: '', quantity: 1, unitPrice: 0 }), itemForm = _20[0], setItemForm = _20[1];
    var _21 = (0, react_1.useState)(null), editingItemIdx = _21[0], setEditingItemIdx = _21[1];
    // ── Edit booking ─────────────────────────────────────────────────────────────
    var _22 = (0, react_1.useState)(false), editBookingDialog = _22[0], setEditBookingDialog = _22[1];
    var _23 = (0, react_1.useState)({
        groupName: '', bookingDate: '', specialRequests: '', notes: '',
    }), editBookingForm = _23[0], setEditBookingForm = _23[1];
    // ── Fetch ─────────────────────────────────────────────────────────────────────
    var fetchAll = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, pr, gr, bpr, bbr, _b, p, g, bp, bb, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    setLoading(true);
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, Promise.all([
                            fetch('/api/day-out/packages'),
                            fetch('/api/day-out/group-bookings'),
                            fetch('/api/day-out/boat-rides/packages'),
                            fetch('/api/day-out/boat-rides/bookings'),
                        ])];
                case 2:
                    _a = _d.sent(), pr = _a[0], gr = _a[1], bpr = _a[2], bbr = _a[3];
                    return [4 /*yield*/, Promise.all([pr.json(), gr.json(), bpr.json(), bbr.json()])];
                case 3:
                    _b = _d.sent(), p = _b[0], g = _b[1], bp = _b[2], bb = _b[3];
                    if (p.success)
                        setDayOutPackages(p.data);
                    if (g.success)
                        setGroupBookings(g.data);
                    if (bp.success)
                        setBoatPackages(bp.data);
                    if (bb.success)
                        setBoatBookings(bb.data);
                    return [3 /*break*/, 6];
                case 4:
                    _c = _d.sent();
                    sonner_1.toast.error('Failed to load data');
                    return [3 /*break*/, 6];
                case 5:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); }, []);
    (0, react_1.useEffect)(function () { fetchAll(); }, [fetchAll]);
    // ── API helpers ───────────────────────────────────────────────────────────────
    var endpoint = function (type) {
        return type === 'group' ? '/api/day-out/group-bookings' : '/api/day-out/boat-rides/bookings';
    };
    var putBooking = function (id, type, body) { return __awaiter(_this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch(endpoint(type), {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(__assign({ id: id }, body)),
                    })];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.json()];
            }
        });
    }); };
    // ── Package CRUD ──────────────────────────────────────────────────────────────
    var saveDayOutPackage = function () { return __awaiter(_this, void 0, void 0, function () {
        var method, body, res, data, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    method = editingPkg ? 'PUT' : 'POST';
                    body = editingPkg ? __assign({ id: editingPkg._id }, pkgForm) : pkgForm;
                    return [4 /*yield*/, fetch('/api/day-out/packages', {
                            method: method,
                            headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
                        })];
                case 1:
                    res = _b.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _b.sent();
                    if (data.success) {
                        sonner_1.toast.success(editingPkg ? 'Package updated' : 'Package created');
                        setPkgDialog(false);
                        fetchAll();
                    }
                    else
                        sonner_1.toast.error(data.error);
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    sonner_1.toast.error('Failed to save package');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var deleteDayOutPackage = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var res, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!confirm('Delete this package?'))
                        return [2 /*return*/];
                    return [4 /*yield*/, fetch("/api/day-out/packages?id=".concat(id), { method: 'DELETE' })];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    if (data.success) {
                        sonner_1.toast.success('Package deleted');
                        fetchAll();
                    }
                    else
                        sonner_1.toast.error(data.error);
                    return [2 /*return*/];
            }
        });
    }); };
    var saveBoatPackage = function () { return __awaiter(_this, void 0, void 0, function () {
        var method, body, res, data, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    method = editingBoatPkg ? 'PUT' : 'POST';
                    body = editingBoatPkg ? __assign({ id: editingBoatPkg._id }, boatPkgForm) : boatPkgForm;
                    return [4 /*yield*/, fetch('/api/day-out/boat-rides/packages', {
                            method: method,
                            headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
                        })];
                case 1:
                    res = _b.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _b.sent();
                    if (data.success) {
                        sonner_1.toast.success(editingBoatPkg ? 'Boat package updated' : 'Boat package created');
                        setBoatPkgDialog(false);
                        fetchAll();
                    }
                    else
                        sonner_1.toast.error(data.error);
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    sonner_1.toast.error('Failed to save boat package');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var deleteBoatPackage = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var res, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!confirm('Delete this boat package?'))
                        return [2 /*return*/];
                    return [4 /*yield*/, fetch("/api/day-out/boat-rides/packages?id=".concat(id), { method: 'DELETE' })];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    if (data.success) {
                        sonner_1.toast.success('Boat package deleted');
                        fetchAll();
                    }
                    else
                        sonner_1.toast.error(data.error);
                    return [2 /*return*/];
            }
        });
    }); };
    // ── Create bookings ───────────────────────────────────────────────────────────
    var createGroupBooking = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, data, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!groupForm.packageId || !groupForm.groupName || !groupForm.bookingDate) {
                        sonner_1.toast.error('Package, group name and date are required');
                        return [2 /*return*/];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch('/api/day-out/group-bookings', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                packageId: groupForm.packageId, groupName: groupForm.groupName,
                                bookingDate: groupForm.bookingDate, numberOfPeople: groupForm.numberOfPeople,
                                contactPerson: { name: groupForm.contactName, phone: groupForm.contactPhone, email: groupForm.contactEmail },
                                specialRequests: groupForm.specialRequests,
                                advanceAmount: groupForm.advanceAmount, paymentMethod: groupForm.paymentMethod,
                            }),
                        })];
                case 2:
                    res = _b.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _b.sent();
                    if (data.success) {
                        sonner_1.toast.success('Group booking created');
                        setCreateGroupDialog(false);
                        fetchAll();
                    }
                    else
                        sonner_1.toast.error(data.error);
                    return [3 /*break*/, 5];
                case 4:
                    _a = _b.sent();
                    sonner_1.toast.error('Failed to create booking');
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var createBoatBooking = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, data, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!boatForm.packageId || !boatForm.bookingDate || !boatForm.departureTime) {
                        sonner_1.toast.error('Package, date and departure time are required');
                        return [2 /*return*/];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch('/api/day-out/boat-rides/bookings', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                packageId: boatForm.packageId, bookingDate: boatForm.bookingDate,
                                departureTime: boatForm.departureTime, numberOfPassengers: boatForm.numberOfPassengers,
                                contactPerson: { name: boatForm.contactName, phone: boatForm.contactPhone, email: boatForm.contactEmail },
                                specialRequests: boatForm.specialRequests,
                                advanceAmount: boatForm.advanceAmount, paymentMethod: boatForm.paymentMethod,
                            }),
                        })];
                case 2:
                    res = _b.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _b.sent();
                    if (data.success) {
                        sonner_1.toast.success('Boat booking created');
                        setCreateBoatDialog(false);
                        fetchAll();
                    }
                    else
                        sonner_1.toast.error(data.error);
                    return [3 /*break*/, 5];
                case 4:
                    _a = _b.sent();
                    sonner_1.toast.error('Failed to create boat booking');
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // ── Booking actions ───────────────────────────────────────────────────────────
    var handlePayment = function () { return __awaiter(_this, void 0, void 0, function () {
        var amount, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selectedBooking)
                        return [2 /*return*/];
                    amount = parseFloat(payAmount);
                    if (!amount || amount <= 0) {
                        sonner_1.toast.error('Enter valid amount');
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, putBooking(selectedBooking._id, selectedType, {
                            action: payAction,
                            amount: amount,
                            method: payMethod, notes: payNotes,
                        })];
                case 1:
                    data = _a.sent();
                    if (data.success) {
                        sonner_1.toast.success(payAction === 'close' ? 'Booking closed!' : 'Payment recorded');
                        setPayDialog(false);
                        setSelectedBooking(data.data);
                        fetchAll();
                    }
                    else
                        sonner_1.toast.error(data.error);
                    return [2 /*return*/];
            }
        });
    }); };
    var handleCancelBooking = function (id, type) { return __awaiter(_this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!confirm('Cancel this booking?'))
                        return [2 /*return*/];
                    return [4 /*yield*/, putBooking(id, type, { action: 'cancel' })];
                case 1:
                    data = _a.sent();
                    if (data.success) {
                        sonner_1.toast.success('Booking cancelled');
                        fetchAll();
                        if ((selectedBooking === null || selectedBooking === void 0 ? void 0 : selectedBooking._id) === id)
                            setSelectedBooking(data.data);
                    }
                    else
                        sonner_1.toast.error(data.error);
                    return [2 /*return*/];
            }
        });
    }); };
    var handleDeleteBooking = function (id, type) { return __awaiter(_this, void 0, void 0, function () {
        var res, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!confirm('Permanently delete this booking?'))
                        return [2 /*return*/];
                    return [4 /*yield*/, fetch("".concat(endpoint(type), "?id=").concat(id), { method: 'DELETE' })];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    if (data.success) {
                        sonner_1.toast.success('Booking deleted');
                        fetchAll();
                        if ((selectedBooking === null || selectedBooking === void 0 ? void 0 : selectedBooking._id) === id)
                            setDetailPanel(false);
                    }
                    else
                        sonner_1.toast.error(data.error);
                    return [2 /*return*/];
            }
        });
    }); };
    var handleSaveItem = function () { return __awaiter(_this, void 0, void 0, function () {
        var isEdit, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selectedBooking)
                        return [2 /*return*/];
                    isEdit = editingItemIdx !== null;
                    return [4 /*yield*/, putBooking(selectedBooking._id, selectedType, isEdit
                            ? { action: 'edit_item', itemIndex: editingItemIdx, itemUpdate: itemForm }
                            : { action: 'add_items', additionalItems: [itemForm] })];
                case 1:
                    data = _a.sent();
                    if (data.success) {
                        sonner_1.toast.success(isEdit ? 'Item updated' : 'Item added');
                        setItemDialog(false);
                        setSelectedBooking(data.data);
                        fetchAll();
                    }
                    else
                        sonner_1.toast.error(data.error);
                    return [2 /*return*/];
            }
        });
    }); };
    var handleDeleteItem = function (idx) { return __awaiter(_this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selectedBooking)
                        return [2 /*return*/];
                    return [4 /*yield*/, putBooking(selectedBooking._id, selectedType, { action: 'delete_item', itemIndex: idx })];
                case 1:
                    data = _a.sent();
                    if (data.success) {
                        sonner_1.toast.success('Item removed');
                        setSelectedBooking(data.data);
                        fetchAll();
                    }
                    else
                        sonner_1.toast.error(data.error);
                    return [2 /*return*/];
            }
        });
    }); };
    var handleSaveBookingEdit = function () { return __awaiter(_this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selectedBooking)
                        return [2 /*return*/];
                    return [4 /*yield*/, putBooking(selectedBooking._id, selectedType, editBookingForm)];
                case 1:
                    data = _a.sent();
                    if (data.success) {
                        sonner_1.toast.success('Booking updated');
                        setEditBookingDialog(false);
                        setSelectedBooking(data.data);
                        fetchAll();
                    }
                    else
                        sonner_1.toast.error(data.error);
                    return [2 /*return*/];
            }
        });
    }); };
    // ── Stats ─────────────────────────────────────────────────────────────────────
    var stats = [
        { label: 'Group Bookings', value: groupBookings.length, sub: "".concat(groupBookings.filter(function (b) { return b.status === 'confirmed'; }).length, " confirmed"), color: 'text-blue-600' },
        { label: 'Boat Bookings', value: boatBookings.length, sub: "".concat(boatBookings.filter(function (b) { return b.status === 'confirmed'; }).length, " confirmed"), color: 'text-cyan-600' },
        { label: 'Day-out Revenue', value: "Rs.".concat(groupBookings.reduce(function (s, b) { var _a; return s + ((_a = b.advancePaid) !== null && _a !== void 0 ? _a : 0); }, 0).toLocaleString()), sub: 'collected', color: 'text-green-600' },
        { label: 'Boat Revenue', value: "Rs.".concat(boatBookings.reduce(function (s, b) { var _a; return s + ((_a = b.advancePaid) !== null && _a !== void 0 ? _a : 0); }, 0).toLocaleString()), sub: 'collected', color: 'text-emerald-600' },
    ];
    // ── Filters ───────────────────────────────────────────────────────────────────
    var filteredGroup = groupBookings.filter(function (b) {
        var _a, _b, _c, _d;
        var matchStatus = statusFilter === 'all' || b.status === statusFilter;
        var q = search.toLowerCase();
        return matchStatus && (b.groupName.toLowerCase().includes(q) || ((_b = (_a = b.contactPerson) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(q)) || ((_d = (_c = b.packageId) === null || _c === void 0 ? void 0 : _c.name) === null || _d === void 0 ? void 0 : _d.toLowerCase().includes(q)));
    });
    var filteredBoat = boatBookings.filter(function (b) {
        var _a, _b, _c, _d;
        var matchStatus = statusFilter === 'all' || b.status === statusFilter;
        var q = search.toLowerCase();
        return matchStatus && (((_b = (_a = b.packageId) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(q)) || ((_d = (_c = b.contactPerson) === null || _c === void 0 ? void 0 : _c.name) === null || _d === void 0 ? void 0 : _d.toLowerCase().includes(q)));
    });
    // ── Open helpers ──────────────────────────────────────────────────────────────
    var openDetail = function (b, type) {
        setSelectedBooking(b);
        setSelectedType(type);
        setDetailPanel(true);
    };
    var openPay = function (b, type, action) {
        var _a, _b;
        setSelectedBooking(b);
        setSelectedType(type);
        setPayAction(action);
        setPayAmount(action === 'close' ? String(Math.max(0, ((_a = b.totalAmount) !== null && _a !== void 0 ? _a : 0) - ((_b = b.advancePaid) !== null && _b !== void 0 ? _b : 0))) : '');
        setPayMethod('cash');
        setPayNotes('');
        setPayDialog(true);
    };
    // ── Booking list row ──────────────────────────────────────────────────────────
    var BookingRow = function (_a) {
        var _b, _c, _d, _e, _f, _g;
        var b = _a.b, type = _a.type;
        var isGroup = type === 'group';
        var gb = b;
        var bb = b;
        return (<div className="rounded-lg border p-4 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{isGroup ? gb.groupName : (((_b = bb.packageId) === null || _b === void 0 ? void 0 : _b.name) || 'Boat Ride')}</span>
              <span className={"rounded-full px-2 py-0.5 text-xs font-medium ".concat(badge(b.status))}>{b.status}</span>
              <span className={"rounded-full px-2 py-0.5 text-xs font-medium ".concat(badge(b.paymentStatus))}>{b.paymentStatus}</span>
            </div>
            <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><lucide_react_1.Calendar className="h-3 w-3"/>{(0, date_fns_1.format)(new Date(b.bookingDate), 'MMM dd, yyyy')}</span>
              {!isGroup && <span className="flex items-center gap-1"><lucide_react_1.Clock className="h-3 w-3"/>{bb.departureTime}</span>}
              <span className="flex items-center gap-1"><lucide_react_1.Users className="h-3 w-3"/>{isGroup ? gb.numberOfPeople : bb.numberOfPassengers} {isGroup ? 'people' : 'passengers'}</span>
              {isGroup && gb.packageId && <span>{gb.packageId.name}</span>}
              {((_c = b.contactPerson) === null || _c === void 0 ? void 0 : _c.name) && <span>{b.contactPerson.name}</span>}
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold">Rs.{((_d = b.totalAmount) !== null && _d !== void 0 ? _d : 0).toLocaleString()}</p>
            <p className="text-xs text-green-600">Paid: Rs.{((_e = b.advancePaid) !== null && _e !== void 0 ? _e : 0).toLocaleString()}</p>
            {((_f = b.balanceAmount) !== null && _f !== void 0 ? _f : 0) > 0 && <p className="text-xs text-red-500">Due: Rs.{((_g = b.balanceAmount) !== null && _g !== void 0 ? _g : 0).toLocaleString()}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button_1.Button variant="ghost" size="sm" className="h-7 text-xs" onClick={function () { return openDetail(b, type); }}>
            <lucide_react_1.Eye className="h-3 w-3 mr-1"/>View
          </button_1.Button>
          {!['cancelled', 'completed'].includes(b.status) && (<button_1.Button variant="outline" size="sm" className="h-7 text-xs" onClick={function () { return openPay(b, type, 'pay'); }}>
              <lucide_react_1.DollarSign className="h-3 w-3 mr-1"/>Payment
            </button_1.Button>)}
          {b.status === 'confirmed' && (<button_1.Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700" onClick={function () { return openPay(b, type, 'close'); }}>
              <lucide_react_1.CheckCircle className="h-3 w-3 mr-1"/>Close
            </button_1.Button>)}
          {b.status === 'completed' && (<button_1.Button variant="outline" size="sm" className="h-7 text-xs" onClick={function () { return printBill(b, type); }}>
              <lucide_react_1.Printer className="h-3 w-3 mr-1"/><lucide_react_1.QrCode className="h-3 w-3 mr-1"/>Print
            </button_1.Button>)}
          {!['completed', 'cancelled'].includes(b.status) && (<button_1.Button variant="ghost" size="sm" className="h-7 text-xs text-orange-500" onClick={function () { return handleCancelBooking(b._id, type); }}>
              <lucide_react_1.XCircle className="h-3 w-3 mr-1"/>Cancel
            </button_1.Button>)}
          <button_1.Button variant="ghost" size="sm" className="h-7 text-xs text-red-600" onClick={function () { return handleDeleteBooking(b._id, type); }}>
            <lucide_react_1.Trash2 className="h-3 w-3 mr-1"/>Delete
          </button_1.Button>
        </div>
      </div>);
    };
    // ── Render ────────────────────────────────────────────────────────────────────
    return (<div className="space-y-4">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(function (s) { return (<div key={s.label} className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={"text-xl font-bold mt-0.5 ".concat(s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </div>); })}
      </div>

      <tabs_1.Tabs value={activeTab} onValueChange={function (v) { setActiveTab(v); setSearch(''); setStatusFilter('all'); }}>
        <tabs_1.TabsList className="grid w-full grid-cols-4">
          <tabs_1.TabsTrigger value="groupBookings"><lucide_react_1.Users className="mr-1.5 h-3.5 w-3.5"/>Group</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="boatBookings"><lucide_react_1.Anchor className="mr-1.5 h-3.5 w-3.5"/>Boat</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="packages"><lucide_react_1.Package className="mr-1.5 h-3.5 w-3.5"/>Day-out Pkgs</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="boatPackages"><lucide_react_1.Anchor className="mr-1.5 h-3.5 w-3.5"/>Boat Pkgs</tabs_1.TabsTrigger>
        </tabs_1.TabsList>

        {/* ══ GROUP BOOKINGS ════════════════════════════════════════════ */}
        <tabs_1.TabsContent value="groupBookings" className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <lucide_react_1.Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground"/>
                <input_1.Input className="pl-8 w-44 h-8 text-sm" placeholder="Search group..." value={search} onChange={function (e) { return setSearch(e.target.value); }}/>
              </div>
              <select_1.Select value={statusFilter} onValueChange={setStatusFilter}>
                <select_1.SelectTrigger className="w-32 h-8 text-sm"><select_1.SelectValue /></select_1.SelectTrigger>
                <select_1.SelectContent>
                  {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(function (s) { return (<select_1.SelectItem key={s} value={s} className="capitalize">{s}</select_1.SelectItem>); })}
                </select_1.SelectContent>
              </select_1.Select>
            </div>
            <div className="flex gap-2">
              <button_1.Button variant="outline" size="sm" onClick={fetchAll}><lucide_react_1.RefreshCw className="h-3.5 w-3.5"/></button_1.Button>
              <button_1.Button size="sm" onClick={function () { setGroupForm({ packageId: '', groupName: '', bookingDate: '', numberOfPeople: 10, contactName: '', contactPhone: '', contactEmail: '', specialRequests: '', advanceAmount: 0, paymentMethod: 'cash' }); setCreateGroupDialog(true); }}>
                <lucide_react_1.Plus className="mr-1.5 h-3.5 w-3.5"/>New Booking
              </button_1.Button>
            </div>
          </div>
          {loading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : (<div className="space-y-3">
              {filteredGroup.length === 0 && <p className="text-center py-8 text-muted-foreground">No group bookings found</p>}
              {filteredGroup.map(function (b) { return <BookingRow key={b._id} b={b} type="group"/>; })}
            </div>)}
        </tabs_1.TabsContent>

        {/* ══ BOAT BOOKINGS ═════════════════════════════════════════════ */}
        <tabs_1.TabsContent value="boatBookings" className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <lucide_react_1.Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground"/>
                <input_1.Input className="pl-8 w-44 h-8 text-sm" placeholder="Search boat..." value={search} onChange={function (e) { return setSearch(e.target.value); }}/>
              </div>
              <select_1.Select value={statusFilter} onValueChange={setStatusFilter}>
                <select_1.SelectTrigger className="w-32 h-8 text-sm"><select_1.SelectValue /></select_1.SelectTrigger>
                <select_1.SelectContent>
                  {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(function (s) { return (<select_1.SelectItem key={s} value={s} className="capitalize">{s}</select_1.SelectItem>); })}
                </select_1.SelectContent>
              </select_1.Select>
            </div>
            <div className="flex gap-2">
              <button_1.Button variant="outline" size="sm" onClick={fetchAll}><lucide_react_1.RefreshCw className="h-3.5 w-3.5"/></button_1.Button>
              <button_1.Button size="sm" onClick={function () { setBoatForm({ packageId: '', bookingDate: '', departureTime: '', numberOfPassengers: 1, contactName: '', contactPhone: '', contactEmail: '', specialRequests: '', advanceAmount: 0, paymentMethod: 'cash' }); setCreateBoatDialog(true); }}>
                <lucide_react_1.Plus className="mr-1.5 h-3.5 w-3.5"/>New Booking
              </button_1.Button>
            </div>
          </div>
          {loading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : (<div className="space-y-3">
              {filteredBoat.length === 0 && <p className="text-center py-8 text-muted-foreground">No boat bookings found</p>}
              {filteredBoat.map(function (b) { return <BookingRow key={b._id} b={b} type="boat"/>; })}
            </div>)}
        </tabs_1.TabsContent>

        {/* ══ DAY-OUT PACKAGES ══════════════════════════════════════════ */}
        <tabs_1.TabsContent value="packages" className="space-y-4">
          <div className="flex justify-end gap-2">
            <button_1.Button variant="outline" size="sm" onClick={fetchAll}><lucide_react_1.RefreshCw className="h-3.5 w-3.5"/></button_1.Button>
            <button_1.Button size="sm" onClick={function () { setEditingPkg(null); setPkgForm({ name: '', description: '', price: 0, capacity: 100, duration: 8, maxGroupSize: 50, minGroupSize: 10, pricePerPerson: 0, discountPercentage: 0, activities: [], inclusions: [], amenities: [] }); setPkgDialog(true); }}>
              <lucide_react_1.Plus className="mr-1.5 h-3.5 w-3.5"/>Add Package
            </button_1.Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {dayOutPackages.map(function (pkg) {
            var _a, _b;
            return (<div key={pkg._id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{pkg.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{pkg.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button_1.Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={function () {
                    setEditingPkg(pkg);
                    setPkgForm({ name: pkg.name, description: pkg.description, price: pkg.price, capacity: pkg.capacity, duration: pkg.duration, maxGroupSize: pkg.maxGroupSize, minGroupSize: pkg.minGroupSize || 10, pricePerPerson: pkg.pricePerPerson, discountPercentage: pkg.discountPercentage || 0, activities: pkg.activities || [], inclusions: pkg.inclusions || [], amenities: pkg.amenities || [] });
                    setPkgDialog(true);
                }}>
                      <lucide_react_1.Edit className="h-3.5 w-3.5"/>
                    </button_1.Button>
                    <button_1.Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={function () { return deleteDayOutPackage(pkg._id); }}>
                      <lucide_react_1.Trash2 className="h-3.5 w-3.5"/>
                    </button_1.Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div><p className="text-xs text-muted-foreground">Rs./Person</p><p className="font-medium">Rs.{pkg.pricePerPerson}</p></div>
                  <div><p className="text-xs text-muted-foreground">Max Group</p><p className="font-medium">{pkg.maxGroupSize} pax</p></div>
                  <div><p className="text-xs text-muted-foreground">Duration</p><p className="font-medium">{pkg.duration}h</p></div>
                </div>
                {pkg.discountPercentage > 0 && <span className="text-xs rounded-full bg-orange-50 text-orange-700 px-2 py-0.5">{pkg.discountPercentage}% discount</span>}
                {((_a = pkg.activities) === null || _a === void 0 ? void 0 : _a.length) > 0 && (<div className="flex flex-wrap gap-1">
                    {pkg.activities.slice(0, 4).map(function (a) { return <span key={a} className="rounded-full bg-blue-50 text-blue-700 text-xs px-2 py-0.5">{a}</span>; })}
                    {pkg.activities.length > 4 && <span className="text-xs text-muted-foreground">+{pkg.activities.length - 4} more</span>}
                  </div>)}
                {((_b = pkg.inclusions) === null || _b === void 0 ? void 0 : _b.length) > 0 && (<div className="text-xs text-muted-foreground">Includes: {pkg.inclusions.join(' · ')}</div>)}
              </div>);
        })}
          </div>
        </tabs_1.TabsContent>

        {/* ══ BOAT PACKAGES ═════════════════════════════════════════════ */}
        <tabs_1.TabsContent value="boatPackages" className="space-y-4">
          <div className="flex justify-end gap-2">
            <button_1.Button variant="outline" size="sm" onClick={fetchAll}><lucide_react_1.RefreshCw className="h-3.5 w-3.5"/></button_1.Button>
            <button_1.Button size="sm" onClick={function () { setEditingBoatPkg(null); setBoatPkgForm({ name: '', description: '', boatType: 'speed_boat', capacity: 10, price: 0, pricePerPerson: 0, duration: 60, departureTime: '', routeDescription: '', safetyRating: 5, mealIncluded: false, lifeJacketsProvided: true }); setBoatPkgDialog(true); }}>
              <lucide_react_1.Plus className="mr-1.5 h-3.5 w-3.5"/>Add Boat Package
            </button_1.Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {boatPackages.map(function (pkg) { return (<div key={pkg._id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{pkg.name}</h3>
                    <span className="text-xs rounded-full bg-cyan-50 text-cyan-700 px-2 py-0.5 capitalize">{pkg.boatType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex gap-1">
                    <button_1.Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={function () {
                setEditingBoatPkg(pkg);
                setBoatPkgForm({ name: pkg.name, description: pkg.description, boatType: pkg.boatType, capacity: pkg.capacity, price: pkg.price, pricePerPerson: pkg.pricePerPerson, duration: pkg.duration, departureTime: pkg.departureTime || '', routeDescription: pkg.routeDescription || '', safetyRating: pkg.safetyRating || 5, mealIncluded: pkg.mealIncluded || false, lifeJacketsProvided: pkg.lifeJacketsProvided !== false });
                setBoatPkgDialog(true);
            }}>
                      <lucide_react_1.Edit className="h-3.5 w-3.5"/>
                    </button_1.Button>
                    <button_1.Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={function () { return deleteBoatPackage(pkg._id); }}>
                      <lucide_react_1.Trash2 className="h-3.5 w-3.5"/>
                    </button_1.Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div><p className="text-xs text-muted-foreground">Rs./Person</p><p className="font-medium">Rs.{pkg.pricePerPerson}</p></div>
                  <div><p className="text-xs text-muted-foreground">Capacity</p><p className="font-medium">{pkg.capacity} pax</p></div>
                  <div><p className="text-xs text-muted-foreground">Duration</p><p className="font-medium">{pkg.duration}min</p></div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><lucide_react_1.Star className="h-3 w-3 text-yellow-500"/>{pkg.safetyRating}/5</span>
                  {pkg.mealIncluded && <span className="rounded-full bg-green-50 text-green-700 px-2 py-0.5">Meal included</span>}
                  {pkg.lifeJacketsProvided && <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5">Life jackets</span>}
                  {pkg.departureTime && <span className="flex items-center gap-1"><lucide_react_1.Clock className="h-3 w-3"/>{pkg.departureTime}</span>}
                </div>
                {pkg.routeDescription && <p className="text-xs text-muted-foreground">{pkg.routeDescription}</p>}
              </div>); })}
          </div>
        </tabs_1.TabsContent>
      </tabs_1.Tabs>

      {/* ══ CREATE GROUP BOOKING DIALOG ══════════════════════════════════ */}
      <dialog_1.Dialog open={createGroupDialog} onOpenChange={setCreateGroupDialog}>
        <dialog_1.DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <dialog_1.DialogHeader><dialog_1.DialogTitle>New Group Day-out Booking</dialog_1.DialogTitle></dialog_1.DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2"><label_1.Label>Package *</label_1.Label>
              <select_1.Select value={groupForm.packageId} onValueChange={function (v) { return setGroupForm(function (f) { return (__assign(__assign({}, f), { packageId: v })); }); }}>
                <select_1.SelectTrigger><select_1.SelectValue placeholder="Select package..."/></select_1.SelectTrigger>
                <select_1.SelectContent>
                  {dayOutPackages.map(function (p) { return <select_1.SelectItem key={p._id} value={p._id}>{p.name} — Rs.{p.pricePerPerson}/person</select_1.SelectItem>; })}
                </select_1.SelectContent>
              </select_1.Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2"><label_1.Label>Group Name *</label_1.Label><input_1.Input value={groupForm.groupName} onChange={function (e) { return setGroupForm(function (f) { return (__assign(__assign({}, f), { groupName: e.target.value })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Event Date *</label_1.Label><input_1.Input type="date" value={groupForm.bookingDate} onChange={function (e) { return setGroupForm(function (f) { return (__assign(__assign({}, f), { bookingDate: e.target.value })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Number of People</label_1.Label><input_1.Input type="number" min={1} value={groupForm.numberOfPeople} onChange={function (e) { return setGroupForm(function (f) { return (__assign(__assign({}, f), { numberOfPeople: parseInt(e.target.value) || 1 })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Contact Name</label_1.Label><input_1.Input value={groupForm.contactName} onChange={function (e) { return setGroupForm(function (f) { return (__assign(__assign({}, f), { contactName: e.target.value })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Contact Phone</label_1.Label><input_1.Input value={groupForm.contactPhone} onChange={function (e) { return setGroupForm(function (f) { return (__assign(__assign({}, f), { contactPhone: e.target.value })); }); }}/></div>
              <div className="col-span-2 space-y-2"><label_1.Label>Contact Email</label_1.Label><input_1.Input type="email" value={groupForm.contactEmail} onChange={function (e) { return setGroupForm(function (f) { return (__assign(__assign({}, f), { contactEmail: e.target.value })); }); }}/></div>
            </div>
            {groupForm.packageId && groupForm.numberOfPeople > 0 && (function () {
            var pkg = dayOutPackages.find(function (p) { return p._id === groupForm.packageId; });
            if (!pkg)
                return null;
            var total = pkg.pricePerPerson * groupForm.numberOfPeople * (1 - (pkg.discountPercentage || 0) / 100);
            return (<div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm">
                  <p className="font-semibold text-blue-700">Estimated Total: Rs.{Math.round(total).toLocaleString()}</p>
                  {pkg.discountPercentage ? <p className="text-xs text-blue-600">{pkg.discountPercentage}% group discount applied</p> : null}
                </div>);
        })()}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><label_1.Label>Advance Amount</label_1.Label><input_1.Input type="number" min={0} value={groupForm.advanceAmount} onChange={function (e) { return setGroupForm(function (f) { return (__assign(__assign({}, f), { advanceAmount: parseFloat(e.target.value) || 0 })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Payment Method</label_1.Label>
                <select_1.Select value={groupForm.paymentMethod} onValueChange={function (v) { return setGroupForm(function (f) { return (__assign(__assign({}, f), { paymentMethod: v })); }); }}>
                  <select_1.SelectTrigger><select_1.SelectValue /></select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="cash">Cash</select_1.SelectItem>
                    <select_1.SelectItem value="card">Card</select_1.SelectItem>
                    <select_1.SelectItem value="bank_transfer">Bank Transfer</select_1.SelectItem>
                  </select_1.SelectContent>
                </select_1.Select>
              </div>
            </div>
            <div className="space-y-2"><label_1.Label>Special Requests</label_1.Label><input_1.Input value={groupForm.specialRequests} onChange={function (e) { return setGroupForm(function (f) { return (__assign(__assign({}, f), { specialRequests: e.target.value })); }); }}/></div>
            <button_1.Button className="w-full" onClick={createGroupBooking} disabled={!groupForm.packageId || !groupForm.groupName || !groupForm.bookingDate}>
              Create Group Booking
            </button_1.Button>
          </div>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>

      {/* ══ CREATE BOAT BOOKING DIALOG ════════════════════════════════════ */}
      <dialog_1.Dialog open={createBoatDialog} onOpenChange={setCreateBoatDialog}>
        <dialog_1.DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <dialog_1.DialogHeader><dialog_1.DialogTitle>New Boat Ride Booking</dialog_1.DialogTitle></dialog_1.DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2"><label_1.Label>Boat Package *</label_1.Label>
              <select_1.Select value={boatForm.packageId} onValueChange={function (v) { return setBoatForm(function (f) { return (__assign(__assign({}, f), { packageId: v })); }); }}>
                <select_1.SelectTrigger><select_1.SelectValue placeholder="Select boat package..."/></select_1.SelectTrigger>
                <select_1.SelectContent>
                  {boatPackages.map(function (p) { return <select_1.SelectItem key={p._id} value={p._id}>{p.name} — {p.boatType.replace('_', ' ')} · Rs.{p.pricePerPerson}/person</select_1.SelectItem>; })}
                </select_1.SelectContent>
              </select_1.Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><label_1.Label>Date *</label_1.Label><input_1.Input type="date" value={boatForm.bookingDate} onChange={function (e) { return setBoatForm(function (f) { return (__assign(__assign({}, f), { bookingDate: e.target.value })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Departure Time *</label_1.Label><input_1.Input type="time" value={boatForm.departureTime} onChange={function (e) { return setBoatForm(function (f) { return (__assign(__assign({}, f), { departureTime: e.target.value })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Passengers</label_1.Label><input_1.Input type="number" min={1} value={boatForm.numberOfPassengers} onChange={function (e) { return setBoatForm(function (f) { return (__assign(__assign({}, f), { numberOfPassengers: parseInt(e.target.value) || 1 })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Contact Name</label_1.Label><input_1.Input value={boatForm.contactName} onChange={function (e) { return setBoatForm(function (f) { return (__assign(__assign({}, f), { contactName: e.target.value })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Contact Phone</label_1.Label><input_1.Input value={boatForm.contactPhone} onChange={function (e) { return setBoatForm(function (f) { return (__assign(__assign({}, f), { contactPhone: e.target.value })); }); }}/></div>
              <div className="col-span-2 space-y-2"><label_1.Label>Contact Email</label_1.Label><input_1.Input type="email" value={boatForm.contactEmail} onChange={function (e) { return setBoatForm(function (f) { return (__assign(__assign({}, f), { contactEmail: e.target.value })); }); }}/></div>
            </div>
            {boatForm.packageId && boatForm.numberOfPassengers > 0 && (function () {
            var pkg = boatPackages.find(function (p) { return p._id === boatForm.packageId; });
            if (!pkg)
                return null;
            var total = pkg.pricePerPerson * boatForm.numberOfPassengers;
            return (<div className="rounded-lg bg-cyan-50 border border-cyan-200 p-3 text-sm">
                  <p className="font-semibold text-cyan-700">Estimated Total: Rs.{total.toLocaleString()}</p>
                </div>);
        })()}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><label_1.Label>Advance Amount</label_1.Label><input_1.Input type="number" min={0} value={boatForm.advanceAmount} onChange={function (e) { return setBoatForm(function (f) { return (__assign(__assign({}, f), { advanceAmount: parseFloat(e.target.value) || 0 })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Payment Method</label_1.Label>
                <select_1.Select value={boatForm.paymentMethod} onValueChange={function (v) { return setBoatForm(function (f) { return (__assign(__assign({}, f), { paymentMethod: v })); }); }}>
                  <select_1.SelectTrigger><select_1.SelectValue /></select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="cash">Cash</select_1.SelectItem>
                    <select_1.SelectItem value="card">Card</select_1.SelectItem>
                    <select_1.SelectItem value="bank_transfer">Bank Transfer</select_1.SelectItem>
                  </select_1.SelectContent>
                </select_1.Select>
              </div>
            </div>
            <div className="space-y-2"><label_1.Label>Special Requests</label_1.Label><input_1.Input value={boatForm.specialRequests} onChange={function (e) { return setBoatForm(function (f) { return (__assign(__assign({}, f), { specialRequests: e.target.value })); }); }}/></div>
            <button_1.Button className="w-full" onClick={createBoatBooking} disabled={!boatForm.packageId || !boatForm.bookingDate || !boatForm.departureTime}>
              Create Boat Booking
            </button_1.Button>
          </div>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>

      {/* ══ DAY-OUT PACKAGE DIALOG ════════════════════════════════════════ */}
      <dialog_1.Dialog open={pkgDialog} onOpenChange={setPkgDialog}>
        <dialog_1.DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <dialog_1.DialogHeader><dialog_1.DialogTitle>{editingPkg ? 'Edit Day-out Package' : 'New Day-out Package'}</dialog_1.DialogTitle></dialog_1.DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2"><label_1.Label>Package Name *</label_1.Label><input_1.Input value={pkgForm.name} onChange={function (e) { return setPkgForm(function (f) { return (__assign(__assign({}, f), { name: e.target.value })); }); }}/></div>
              <div className="col-span-2 space-y-2"><label_1.Label>Description</label_1.Label><input_1.Input value={pkgForm.description} onChange={function (e) { return setPkgForm(function (f) { return (__assign(__assign({}, f), { description: e.target.value })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Base Price (Rs.)</label_1.Label><input_1.Input type="number" min={0} value={pkgForm.price} onChange={function (e) { return setPkgForm(function (f) { return (__assign(__assign({}, f), { price: parseFloat(e.target.value) || 0 })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Price per Person *</label_1.Label><input_1.Input type="number" min={0} value={pkgForm.pricePerPerson} onChange={function (e) { return setPkgForm(function (f) { return (__assign(__assign({}, f), { pricePerPerson: parseFloat(e.target.value) || 0 })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Min Group Size</label_1.Label><input_1.Input type="number" min={1} value={pkgForm.minGroupSize} onChange={function (e) { return setPkgForm(function (f) { return (__assign(__assign({}, f), { minGroupSize: parseInt(e.target.value) || 1 })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Max Group Size</label_1.Label><input_1.Input type="number" min={1} value={pkgForm.maxGroupSize} onChange={function (e) { return setPkgForm(function (f) { return (__assign(__assign({}, f), { maxGroupSize: parseInt(e.target.value) || 1 })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Capacity</label_1.Label><input_1.Input type="number" min={1} value={pkgForm.capacity} onChange={function (e) { return setPkgForm(function (f) { return (__assign(__assign({}, f), { capacity: parseInt(e.target.value) || 1 })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Duration (hours)</label_1.Label><input_1.Input type="number" min={1} value={pkgForm.duration} onChange={function (e) { return setPkgForm(function (f) { return (__assign(__assign({}, f), { duration: parseInt(e.target.value) || 1 })); }); }}/></div>
              <div className="col-span-2 space-y-2"><label_1.Label>Discount %</label_1.Label><input_1.Input type="number" min={0} max={100} value={pkgForm.discountPercentage} onChange={function (e) { return setPkgForm(function (f) { return (__assign(__assign({}, f), { discountPercentage: parseFloat(e.target.value) || 0 })); }); }}/></div>
            </div>
            <div className="space-y-2">
              <label_1.Label>Activities (comma-separated)</label_1.Label>
              <input_1.Input value={pkgForm.activities.join(', ')} onChange={function (e) { return setPkgForm(function (f) { return (__assign(__assign({}, f), { activities: e.target.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean) })); }); }} placeholder="swimming, bbq, water sports"/>
            </div>
            <div className="space-y-2">
              <label_1.Label>Inclusions (comma-separated)</label_1.Label>
              <input_1.Input value={pkgForm.inclusions.join(', ')} onChange={function (e) { return setPkgForm(function (f) { return (__assign(__assign({}, f), { inclusions: e.target.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean) })); }); }} placeholder="lunch, transport, guide"/>
            </div>
            <div className="space-y-2">
              <label_1.Label>Amenities (comma-separated)</label_1.Label>
              <input_1.Input value={pkgForm.amenities.join(', ')} onChange={function (e) { return setPkgForm(function (f) { return (__assign(__assign({}, f), { amenities: e.target.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean) })); }); }} placeholder="restrooms, changing rooms"/>
            </div>
            <button_1.Button className="w-full" onClick={saveDayOutPackage} disabled={!pkgForm.name || !pkgForm.pricePerPerson}>
              {editingPkg ? 'Save Changes' : 'Create Package'}
            </button_1.Button>
          </div>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>

      {/* ══ BOAT PACKAGE DIALOG ═══════════════════════════════════════════ */}
      <dialog_1.Dialog open={boatPkgDialog} onOpenChange={setBoatPkgDialog}>
        <dialog_1.DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <dialog_1.DialogHeader><dialog_1.DialogTitle>{editingBoatPkg ? 'Edit Boat Package' : 'New Boat Package'}</dialog_1.DialogTitle></dialog_1.DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2"><label_1.Label>Name *</label_1.Label><input_1.Input value={boatPkgForm.name} onChange={function (e) { return setBoatPkgForm(function (f) { return (__assign(__assign({}, f), { name: e.target.value })); }); }}/></div>
              <div className="col-span-2 space-y-2"><label_1.Label>Description</label_1.Label><input_1.Input value={boatPkgForm.description} onChange={function (e) { return setBoatPkgForm(function (f) { return (__assign(__assign({}, f), { description: e.target.value })); }); }}/></div>
              <div className="col-span-2 space-y-2"><label_1.Label>Boat Type *</label_1.Label>
                <select_1.Select value={boatPkgForm.boatType} onValueChange={function (v) { return setBoatPkgForm(function (f) { return (__assign(__assign({}, f), { boatType: v })); }); }}>
                  <select_1.SelectTrigger><select_1.SelectValue /></select_1.SelectTrigger>
                  <select_1.SelectContent>
                    {['speed_boat', 'houseboat', 'yacht', 'catamaran', 'ferry'].map(function (t) { return (<select_1.SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</select_1.SelectItem>); })}
                  </select_1.SelectContent>
                </select_1.Select>
              </div>
              <div className="space-y-2"><label_1.Label>Capacity *</label_1.Label><input_1.Input type="number" min={1} value={boatPkgForm.capacity} onChange={function (e) { return setBoatPkgForm(function (f) { return (__assign(__assign({}, f), { capacity: parseInt(e.target.value) || 1 })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Duration (min)</label_1.Label><input_1.Input type="number" min={1} value={boatPkgForm.duration} onChange={function (e) { return setBoatPkgForm(function (f) { return (__assign(__assign({}, f), { duration: parseInt(e.target.value) || 1 })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Base Price (Rs.)</label_1.Label><input_1.Input type="number" min={0} value={boatPkgForm.price} onChange={function (e) { return setBoatPkgForm(function (f) { return (__assign(__assign({}, f), { price: parseFloat(e.target.value) || 0 })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Price per Person *</label_1.Label><input_1.Input type="number" min={0} value={boatPkgForm.pricePerPerson} onChange={function (e) { return setBoatPkgForm(function (f) { return (__assign(__assign({}, f), { pricePerPerson: parseFloat(e.target.value) || 0 })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Departure Time</label_1.Label><input_1.Input type="time" value={boatPkgForm.departureTime} onChange={function (e) { return setBoatPkgForm(function (f) { return (__assign(__assign({}, f), { departureTime: e.target.value })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Safety Rating (1–5)</label_1.Label><input_1.Input type="number" min={1} max={5} value={boatPkgForm.safetyRating} onChange={function (e) { return setBoatPkgForm(function (f) { return (__assign(__assign({}, f), { safetyRating: parseInt(e.target.value) || 5 })); }); }}/></div>
              <div className="col-span-2 space-y-2"><label_1.Label>Route Description</label_1.Label><input_1.Input value={boatPkgForm.routeDescription} onChange={function (e) { return setBoatPkgForm(function (f) { return (__assign(__assign({}, f), { routeDescription: e.target.value })); }); }}/></div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={boatPkgForm.mealIncluded} onChange={function (e) { return setBoatPkgForm(function (f) { return (__assign(__assign({}, f), { mealIncluded: e.target.checked })); }); }}/>
                Meal Included
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={boatPkgForm.lifeJacketsProvided} onChange={function (e) { return setBoatPkgForm(function (f) { return (__assign(__assign({}, f), { lifeJacketsProvided: e.target.checked })); }); }}/>
                Life Jackets Provided
              </label>
            </div>
            <button_1.Button className="w-full" onClick={saveBoatPackage} disabled={!boatPkgForm.name || !boatPkgForm.pricePerPerson}>
              {editingBoatPkg ? 'Save Changes' : 'Create Boat Package'}
            </button_1.Button>
          </div>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>

      {/* ══ PAYMENT DIALOG ════════════════════════════════════════════════ */}
      <dialog_1.Dialog open={payDialog} onOpenChange={setPayDialog}>
        <dialog_1.DialogContent>
          <dialog_1.DialogHeader>
            <dialog_1.DialogTitle>{payAction === 'close' ? 'Close Booking' : 'Record Payment'}</dialog_1.DialogTitle>
          </dialog_1.DialogHeader>
          {selectedBooking && (<div className="space-y-4 pt-2">
              <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Total</span><span className="font-bold">Rs.{((_a = selectedBooking.totalAmount) !== null && _a !== void 0 ? _a : 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-green-600"><span>Paid So Far</span><span>Rs.{((_b = selectedBooking.advancePaid) !== null && _b !== void 0 ? _b : 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-red-500 font-medium"><span>Balance Due</span><span>Rs.{(((_c = selectedBooking.totalAmount) !== null && _c !== void 0 ? _c : 0) - ((_d = selectedBooking.advancePaid) !== null && _d !== void 0 ? _d : 0)).toLocaleString()}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><label_1.Label>Amount *</label_1.Label><input_1.Input type="number" min={0} step={0.01} value={payAmount} onChange={function (e) { return setPayAmount(e.target.value); }}/></div>
                <div className="space-y-2"><label_1.Label>Method</label_1.Label>
                  <select_1.Select value={payMethod} onValueChange={setPayMethod}>
                    <select_1.SelectTrigger><select_1.SelectValue /></select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="cash">Cash</select_1.SelectItem>
                      <select_1.SelectItem value="card">Card</select_1.SelectItem>
                      <select_1.SelectItem value="bank_transfer">Bank Transfer</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>
              </div>
              <div className="space-y-2"><label_1.Label>Notes</label_1.Label><input_1.Input value={payNotes} onChange={function (e) { return setPayNotes(e.target.value); }} placeholder="e.g. advance payment"/></div>
              <button_1.Button className="w-full" onClick={handlePayment} disabled={!payAmount || parseFloat(payAmount) <= 0}>
                {payAction === 'close' ? 'Close & Settle' : 'Record Payment'}
              </button_1.Button>
            </div>)}
        </dialog_1.DialogContent>
      </dialog_1.Dialog>

      {/* ══ ADD / EDIT ITEM DIALOG ════════════════════════════════════════ */}
      <dialog_1.Dialog open={itemDialog} onOpenChange={setItemDialog}>
        <dialog_1.DialogContent>
          <dialog_1.DialogHeader><dialog_1.DialogTitle>{editingItemIdx !== null ? 'Edit Item' : 'Add Item to Bill'}</dialog_1.DialogTitle></dialog_1.DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2"><label_1.Label>Item Name *</label_1.Label><input_1.Input value={itemForm.name} onChange={function (e) { return setItemForm(function (f) { return (__assign(__assign({}, f), { name: e.target.value })); }); }} placeholder="e.g. Extra refreshments"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><label_1.Label>Quantity</label_1.Label><input_1.Input type="number" min={1} value={itemForm.quantity} onChange={function (e) { return setItemForm(function (f) { return (__assign(__assign({}, f), { quantity: parseInt(e.target.value) || 1 })); }); }}/></div>
              <div className="space-y-2"><label_1.Label>Unit Price (Rs.)</label_1.Label><input_1.Input type="number" min={0} value={itemForm.unitPrice} onChange={function (e) { return setItemForm(function (f) { return (__assign(__assign({}, f), { unitPrice: parseFloat(e.target.value) || 0 })); }); }}/></div>
            </div>
            {itemForm.unitPrice > 0 && (<p className="text-sm font-medium text-muted-foreground">Total: Rs.{(itemForm.quantity * itemForm.unitPrice).toLocaleString()}</p>)}
            <button_1.Button className="w-full" onClick={handleSaveItem} disabled={!itemForm.name.trim() || itemForm.unitPrice <= 0}>
              {editingItemIdx !== null ? 'Update Item' : 'Add Item'}
            </button_1.Button>
          </div>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>

      {/* ══ EDIT BOOKING DIALOG ═══════════════════════════════════════════ */}
      <dialog_1.Dialog open={editBookingDialog} onOpenChange={setEditBookingDialog}>
        <dialog_1.DialogContent>
          <dialog_1.DialogHeader><dialog_1.DialogTitle>Edit Booking</dialog_1.DialogTitle></dialog_1.DialogHeader>
          <div className="space-y-3 pt-2">
            {selectedType === 'group' && (<div className="space-y-2"><label_1.Label>Group Name</label_1.Label><input_1.Input value={editBookingForm.groupName} onChange={function (e) { return setEditBookingForm(function (f) { return (__assign(__assign({}, f), { groupName: e.target.value })); }); }}/></div>)}
            <div className="space-y-2"><label_1.Label>Date</label_1.Label><input_1.Input type="date" value={editBookingForm.bookingDate} onChange={function (e) { return setEditBookingForm(function (f) { return (__assign(__assign({}, f), { bookingDate: e.target.value })); }); }}/></div>
            <div className="space-y-2"><label_1.Label>Special Requests</label_1.Label><input_1.Input value={editBookingForm.specialRequests} onChange={function (e) { return setEditBookingForm(function (f) { return (__assign(__assign({}, f), { specialRequests: e.target.value })); }); }}/></div>
            <div className="space-y-2"><label_1.Label>Internal Notes</label_1.Label><input_1.Input value={editBookingForm.notes} onChange={function (e) { return setEditBookingForm(function (f) { return (__assign(__assign({}, f), { notes: e.target.value })); }); }}/></div>
            <button_1.Button className="w-full" onClick={handleSaveBookingEdit}>Save Changes</button_1.Button>
          </div>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>

      {/* ══ BOOKING DETAIL PANEL ══════════════════════════════════════════ */}
      {detailPanel && selectedBooking && (<div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={function () { return setDetailPanel(false); }}/>
          <div className="relative bg-background w-full sm:w-[500px] h-full overflow-y-auto shadow-2xl flex flex-col">

            {/* Header */}
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-bold text-lg">
                  {selectedType === 'group'
                ? selectedBooking.groupName
                : ((_e = selectedBooking.packageId) === null || _e === void 0 ? void 0 : _e.name) || 'Boat Ride'}
                </h2>
                <div className="flex gap-2 mt-0.5">
                  <span className={"rounded-full px-2 py-0.5 text-xs font-medium ".concat(badge(selectedBooking.status))}>{selectedBooking.status}</span>
                  <span className={"rounded-full px-2 py-0.5 text-xs font-medium ".concat(badge(selectedBooking.paymentStatus))}>{selectedBooking.paymentStatus}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button_1.Button variant="ghost" size="sm" onClick={function () {
                var _a;
                var b = selectedBooking;
                setEditBookingForm({ groupName: b.groupName || '', bookingDate: ((_a = b.bookingDate) === null || _a === void 0 ? void 0 : _a.slice(0, 10)) || '', specialRequests: b.specialRequests || '', notes: b.notes || '' });
                setEditBookingDialog(true);
            }}><lucide_react_1.Edit className="h-4 w-4"/></button_1.Button>
                {selectedBooking.status === 'completed' && (<button_1.Button variant="ghost" size="sm" onClick={function () { return printBill(selectedBooking, selectedType); }}>
                    <lucide_react_1.Printer className="h-4 w-4"/>
                  </button_1.Button>)}
                <button_1.Button variant="ghost" size="sm" onClick={function () { return setDetailPanel(false); }}><lucide_react_1.XCircle className="h-5 w-5"/></button_1.Button>
              </div>
            </div>

            <div className="p-4 space-y-4 text-sm">
              {/* Event Info */}
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{(0, date_fns_1.format)(new Date(selectedBooking.bookingDate), 'dd MMM yyyy')}</p></div>
                {selectedType === 'boat' && <div><p className="text-xs text-muted-foreground">Departure</p><p className="font-medium">{selectedBooking.departureTime}</p></div>}
                <div>
                  <p className="text-xs text-muted-foreground">{selectedType === 'group' ? 'People' : 'Passengers'}</p>
                  <p className="font-medium">{selectedType === 'group' ? selectedBooking.numberOfPeople : selectedBooking.numberOfPassengers}</p>
                </div>
                {selectedType === 'group' && selectedBooking.packageId && (<div><p className="text-xs text-muted-foreground">Package</p><p className="font-medium">{selectedBooking.packageId.name}</p></div>)}
              </div>

              {/* Contact */}
              {((_f = selectedBooking.contactPerson) === null || _f === void 0 ? void 0 : _f.name) && (<div className="rounded-lg bg-muted/30 p-3 space-y-1">
                  <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Contact</p>
                  {[['Name', selectedBooking.contactPerson.name], ['Phone', selectedBooking.contactPerson.phone], ['Email', selectedBooking.contactPerson.email]].map(function (_a) {
                    var l = _a[0], v = _a[1];
                    return v ? (<div key={l} className="flex gap-2"><span className="text-muted-foreground w-12">{l}</span><span className="font-medium">{v}</span></div>) : null;
                })}
                </div>)}

              {selectedBooking.specialRequests && (<div><p className="text-xs text-muted-foreground mb-1">Special Requests</p><p>{selectedBooking.specialRequests}</p></div>)}

              {/* Financial */}
              <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Package Base</span><span>Rs.{((_g = selectedBooking.totalPrice) !== null && _g !== void 0 ? _g : 0).toLocaleString()}</span></div>
                {((_h = selectedBooking.additionalItems) !== null && _h !== void 0 ? _h : []).length > 0 && (<div className="flex justify-between"><span className="text-muted-foreground">Extras</span><span>Rs.{(((_j = selectedBooking.totalAmount) !== null && _j !== void 0 ? _j : 0) - ((_k = selectedBooking.totalPrice) !== null && _k !== void 0 ? _k : 0)).toLocaleString()}</span></div>)}
                <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>Rs.{((_l = selectedBooking.totalAmount) !== null && _l !== void 0 ? _l : 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-green-600"><span>Paid</span><span>Rs.{((_m = selectedBooking.advancePaid) !== null && _m !== void 0 ? _m : 0).toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-red-600"><span>Balance Due</span><span>Rs.{((_o = selectedBooking.balanceAmount) !== null && _o !== void 0 ? _o : 0).toLocaleString()}</span></div>
              </div>

              {/* Additional Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">Additional Items</p>
                  {!['cancelled', 'completed'].includes(selectedBooking.status) && (<button_1.Button variant="outline" size="sm" className="h-7 text-xs" onClick={function () { setEditingItemIdx(null); setItemForm({ name: '', quantity: 1, unitPrice: 0 }); setItemDialog(true); }}>
                      <lucide_react_1.Plus className="h-3 w-3 mr-1"/>Add
                    </button_1.Button>)}
                </div>
                {((_p = selectedBooking.additionalItems) !== null && _p !== void 0 ? _p : []).length === 0 ? (<p className="text-xs text-muted-foreground">No additional items</p>) : ((_q = selectedBooking.additionalItems) !== null && _q !== void 0 ? _q : []).map(function (item, idx) { return (<div key={idx} className="flex items-center justify-between border-b py-2">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground text-xs ml-2">×{item.quantity} @ Rs.{item.unitPrice}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Rs.{item.total.toLocaleString()}</span>
                      {!['cancelled', 'completed'].includes(selectedBooking.status) && (<>
                          <button_1.Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={function () { setEditingItemIdx(idx); setItemForm({ name: item.name, quantity: item.quantity, unitPrice: item.unitPrice }); setItemDialog(true); }}>
                            <lucide_react_1.Edit className="h-3 w-3"/>
                          </button_1.Button>
                          <button_1.Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={function () { return handleDeleteItem(idx); }}>
                            <lucide_react_1.Trash2 className="h-3 w-3"/>
                          </button_1.Button>
                        </>)}
                    </div>
                  </div>); })}
              </div>

              {/* Payment History */}
              {((_r = selectedBooking.payments) !== null && _r !== void 0 ? _r : []).length > 0 && (<div>
                  <p className="font-semibold mb-2">Payment History</p>
                  {((_s = selectedBooking.payments) !== null && _s !== void 0 ? _s : []).map(function (p, i) { return (<div key={i} className="flex justify-between rounded bg-muted/30 px-2 py-1.5 mb-1">
                      <span className="capitalize">{p.method} — Rs.{p.amount.toLocaleString()}{p.notes ? " \u00B7 ".concat(p.notes) : ''}</span>
                      <span className="text-muted-foreground text-xs">{(0, date_fns_1.format)(new Date(p.date), 'MMM dd, yyyy')}</span>
                    </div>); })}
                </div>)}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {!['cancelled', 'completed'].includes(selectedBooking.status) && (<button_1.Button variant="outline" size="sm" onClick={function () { setPayAction('pay'); setPayAmount(''); setPayMethod('cash'); setPayNotes(''); setPayDialog(true); }}>
                    <lucide_react_1.DollarSign className="h-3.5 w-3.5 mr-1"/>Record Payment
                  </button_1.Button>)}
                {selectedBooking.status === 'confirmed' && (<button_1.Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={function () { var _a, _b; setPayAction('close'); setPayAmount(String(Math.max(0, ((_a = selectedBooking.totalAmount) !== null && _a !== void 0 ? _a : 0) - ((_b = selectedBooking.advancePaid) !== null && _b !== void 0 ? _b : 0)))); setPayMethod('cash'); setPayNotes(''); setPayDialog(true); }}>
                    <lucide_react_1.CheckCircle className="h-3.5 w-3.5 mr-1"/>Close Booking
                  </button_1.Button>)}
                {selectedBooking.status === 'completed' && (<button_1.Button variant="outline" size="sm" onClick={function () { return printBill(selectedBooking, selectedType); }}>
                    <lucide_react_1.Printer className="h-3.5 w-3.5 mr-1"/><lucide_react_1.QrCode className="h-3.5 w-3.5 mr-1"/>Print Bill
                  </button_1.Button>)}
                {!['completed', 'cancelled'].includes(selectedBooking.status) && (<button_1.Button variant="ghost" size="sm" className="text-orange-500" onClick={function () { return handleCancelBooking(selectedBooking._id, selectedType); }}>
                    <lucide_react_1.XCircle className="h-3.5 w-3.5 mr-1"/>Cancel
                  </button_1.Button>)}
                <button_1.Button variant="ghost" size="sm" className="text-red-600" onClick={function () { return handleDeleteBooking(selectedBooking._id, selectedType); }}>
                  <lucide_react_1.Trash2 className="h-3.5 w-3.5 mr-1"/>Delete
                </button_1.Button>
              </div>
            </div>
          </div>
        </div>)}
    </div>);
}
