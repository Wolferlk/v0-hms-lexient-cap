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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
exports.PUT = PUT;
exports.DELETE = DELETE;
var mongodb_1 = require("@/lib/mongodb");
var DayOut_1 = require("@/lib/models/DayOut");
var server_1 = require("next/server");
var sampleData_1 = require("@/lib/sampleData");
function GET(request) {
    return __awaiter(this, void 0, void 0, function () {
        var searchParams, status_1, query_1, bookings, fallbackBookings, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, (0, mongodb_1.connectDB)()];
                case 1:
                    _a.sent();
                    searchParams = new URL(request.url).searchParams;
                    status_1 = searchParams.get('status');
                    query_1 = {};
                    if (status_1)
                        query_1.status = status_1;
                    return [4 /*yield*/, DayOut_1.BoatRideBooking.find(query_1)
                            .populate('packageId', 'name boatType capacity pricePerPerson')
                            .populate('customerId', 'name email phone')
                            .sort({ bookingDate: -1 })];
                case 2:
                    bookings = _a.sent();
                    fallbackBookings = (0, sampleData_1.withPopulatedRelations)(sampleData_1.sampleBoatRideBookings, {
                        packageId: sampleData_1.sampleBoatRidePackages,
                        customerId: sampleData_1.sampleCustomers,
                    }).filter(function (booking) {
                        if (query_1.status && booking.status !== query_1.status)
                            return false;
                        return true;
                    });
                    return [2 /*return*/, server_1.NextResponse.json({ success: true, data: bookings.length ? bookings : fallbackBookings })];
                case 3:
                    error_1 = _a.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ success: false, error: error_1.message }, { status: 500 })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function POST(request) {
    return __awaiter(this, void 0, void 0, function () {
        var body, packageId, customerId, bookingDate, departureTime, numberOfPassengers, contactPerson, specialRequests, advanceAmount, paymentMethod, boatPackage, totalPrice, depositAmount, balanceAmount, booking, populated, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, (0, mongodb_1.connectDB)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, request.json()];
                case 2:
                    body = _a.sent();
                    packageId = body.packageId, customerId = body.customerId, bookingDate = body.bookingDate, departureTime = body.departureTime, numberOfPassengers = body.numberOfPassengers, contactPerson = body.contactPerson, specialRequests = body.specialRequests, advanceAmount = body.advanceAmount, paymentMethod = body.paymentMethod;
                    if (!packageId || !bookingDate || !departureTime || !numberOfPassengers) {
                        return [2 /*return*/, server_1.NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })];
                    }
                    return [4 /*yield*/, DayOut_1.BoatRidePackage.findById(packageId)];
                case 3:
                    boatPackage = _a.sent();
                    if (!boatPackage) {
                        return [2 /*return*/, server_1.NextResponse.json({ success: false, error: 'Boat package not found' }, { status: 404 })];
                    }
                    if (numberOfPassengers > boatPackage.capacity) {
                        return [2 /*return*/, server_1.NextResponse.json({ success: false, error: 'Number of passengers exceeds boat capacity' }, { status: 400 })];
                    }
                    totalPrice = numberOfPassengers * boatPackage.pricePerPerson;
                    depositAmount = Math.round(totalPrice * 0.3);
                    balanceAmount = totalPrice - depositAmount;
                    booking = new DayOut_1.BoatRideBooking({
                        packageId: packageId,
                        customerId: customerId,
                        bookingDate: new Date(bookingDate),
                        departureTime: departureTime,
                        numberOfPassengers: numberOfPassengers,
                        totalPrice: totalPrice,
                        totalAmount: totalPrice,
                        depositAmount: depositAmount,
                        balanceAmount: balanceAmount,
                        advancePaid: advanceAmount > 0 ? advanceAmount : 0,
                        payments: advanceAmount > 0 ? [{ amount: advanceAmount, method: paymentMethod || 'cash', date: new Date(), notes: 'Advance payment' }] : [],
                        additionalItems: [],
                        contactPerson: contactPerson,
                        specialRequests: specialRequests,
                        paymentStatus: advanceAmount > 0 ? 'partial' : 'pending',
                        status: advanceAmount > 0 ? 'confirmed' : 'pending',
                    });
                    return [4 /*yield*/, booking.save()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, booking.populate('packageId').populate('customerId')];
                case 5:
                    populated = _a.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ success: true, data: populated }, { status: 201 })];
                case 6:
                    error_2 = _a.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ success: false, error: error_2.message }, { status: 500 })];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function PUT(request) {
    return __awaiter(this, void 0, void 0, function () {
        var body, id, action, amount, method, notes, additionalItems, itemIndex, itemUpdate, updateData, booking, _i, additionalItems_1, item, addedTotal, existing, addedTotal, addedTotal, due, updated, error_3;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 24, , 25]);
                    return [4 /*yield*/, (0, mongodb_1.connectDB)()];
                case 1:
                    _e.sent();
                    return [4 /*yield*/, request.json()];
                case 2:
                    body = _e.sent();
                    id = body.id, action = body.action, amount = body.amount, method = body.method, notes = body.notes, additionalItems = body.additionalItems, itemIndex = body.itemIndex, itemUpdate = body.itemUpdate, updateData = __rest(body, ["id", "action", "amount", "method", "notes", "additionalItems", "itemIndex", "itemUpdate"]);
                    if (!id) {
                        return [2 /*return*/, server_1.NextResponse.json({ success: false, error: 'Booking ID required' }, { status: 400 })];
                    }
                    return [4 /*yield*/, DayOut_1.BoatRideBooking.findById(id)];
                case 3:
                    booking = _e.sent();
                    if (!booking) {
                        return [2 /*return*/, server_1.NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })];
                    }
                    if (!(action === 'pay')) return [3 /*break*/, 6];
                    if (!amount || amount <= 0) {
                        return [2 /*return*/, server_1.NextResponse.json({ success: false, error: 'Payment amount required' }, { status: 400 })];
                    }
                    booking.payments.push({ amount: amount, method: method || 'cash', date: new Date(), notes: notes || '' });
                    booking.advancePaid = (booking.advancePaid || 0) + amount;
                    booking.balanceAmount = Math.max(0, booking.totalAmount - booking.advancePaid);
                    if (booking.advancePaid >= booking.depositAmount && booking.status === 'pending') {
                        booking.status = 'confirmed';
                    }
                    if (booking.advancePaid >= booking.totalAmount) {
                        booking.paymentStatus = 'paid';
                    }
                    else if (booking.advancePaid > 0) {
                        booking.paymentStatus = 'partial';
                    }
                    booking.updatedAt = new Date();
                    return [4 /*yield*/, booking.save()];
                case 4:
                    _e.sent();
                    return [4 /*yield*/, booking.populate('packageId').populate('customerId')];
                case 5:
                    _e.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ success: true, data: booking })];
                case 6:
                    if (!(action === 'add_items')) return [3 /*break*/, 9];
                    if (!additionalItems || !Array.isArray(additionalItems) || additionalItems.length === 0) {
                        return [2 /*return*/, server_1.NextResponse.json({ success: false, error: 'No additional items provided' }, { status: 400 })];
                    }
                    for (_i = 0, additionalItems_1 = additionalItems; _i < additionalItems_1.length; _i++) {
                        item = additionalItems_1[_i];
                        booking.additionalItems.push({
                            name: item.name,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            total: item.unitPrice * item.quantity,
                        });
                    }
                    addedTotal = booking.additionalItems.reduce(function (sum, item) { return sum + item.total; }, 0);
                    booking.totalAmount = booking.totalPrice + addedTotal;
                    booking.balanceAmount = Math.max(0, booking.totalAmount - booking.advancePaid);
                    booking.updatedAt = new Date();
                    return [4 /*yield*/, booking.save()];
                case 7:
                    _e.sent();
                    return [4 /*yield*/, booking.populate('packageId').populate('customerId')];
                case 8:
                    _e.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ success: true, data: booking })];
                case 9:
                    if (!(action === 'edit_item')) return [3 /*break*/, 12];
                    if (itemIndex === undefined || itemIndex < 0 || itemIndex >= booking.additionalItems.length) {
                        return [2 /*return*/, server_1.NextResponse.json({ success: false, error: 'Invalid item index' }, { status: 400 })];
                    }
                    existing = booking.additionalItems[itemIndex];
                    booking.additionalItems[itemIndex] = {
                        name: (itemUpdate === null || itemUpdate === void 0 ? void 0 : itemUpdate.name) || existing.name,
                        quantity: (_a = itemUpdate === null || itemUpdate === void 0 ? void 0 : itemUpdate.quantity) !== null && _a !== void 0 ? _a : existing.quantity,
                        unitPrice: (_b = itemUpdate === null || itemUpdate === void 0 ? void 0 : itemUpdate.unitPrice) !== null && _b !== void 0 ? _b : existing.unitPrice,
                        total: ((_c = itemUpdate === null || itemUpdate === void 0 ? void 0 : itemUpdate.unitPrice) !== null && _c !== void 0 ? _c : existing.unitPrice) * ((_d = itemUpdate === null || itemUpdate === void 0 ? void 0 : itemUpdate.quantity) !== null && _d !== void 0 ? _d : existing.quantity),
                    };
                    addedTotal = booking.additionalItems.reduce(function (sum, item) { return sum + item.total; }, 0);
                    booking.totalAmount = booking.totalPrice + addedTotal;
                    booking.balanceAmount = Math.max(0, booking.totalAmount - booking.advancePaid);
                    booking.updatedAt = new Date();
                    return [4 /*yield*/, booking.save()];
                case 10:
                    _e.sent();
                    return [4 /*yield*/, booking.populate('packageId').populate('customerId')];
                case 11:
                    _e.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ success: true, data: booking })];
                case 12:
                    if (!(action === 'delete_item')) return [3 /*break*/, 15];
                    if (itemIndex === undefined || itemIndex < 0 || itemIndex >= booking.additionalItems.length) {
                        return [2 /*return*/, server_1.NextResponse.json({ success: false, error: 'Invalid item index' }, { status: 400 })];
                    }
                    booking.additionalItems.splice(itemIndex, 1);
                    addedTotal = booking.additionalItems.reduce(function (sum, item) { return sum + item.total; }, 0);
                    booking.totalAmount = booking.totalPrice + addedTotal;
                    booking.balanceAmount = Math.max(0, booking.totalAmount - booking.advancePaid);
                    booking.updatedAt = new Date();
                    return [4 /*yield*/, booking.save()];
                case 13:
                    _e.sent();
                    return [4 /*yield*/, booking.populate('packageId').populate('customerId')];
                case 14:
                    _e.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ success: true, data: booking })];
                case 15:
                    if (!(action === 'close')) return [3 /*break*/, 18];
                    if (booking.status !== 'confirmed') {
                        return [2 /*return*/, server_1.NextResponse.json({ success: false, error: 'Only confirmed bookings can be closed' }, { status: 400 })];
                    }
                    due = Math.max(0, booking.totalAmount - booking.advancePaid);
                    if (due > 0 && (!amount || amount < due)) {
                        return [2 /*return*/, server_1.NextResponse.json({ success: false, error: 'Closing requires full settlement of the remaining balance' }, { status: 400 })];
                    }
                    if (amount && amount > 0) {
                        booking.payments.push({ amount: amount, method: method || 'cash', date: new Date(), notes: notes || '' });
                        booking.advancePaid = (booking.advancePaid || 0) + amount;
                    }
                    booking.balanceAmount = Math.max(0, booking.totalAmount - booking.advancePaid);
                    booking.paymentStatus = booking.balanceAmount === 0 ? 'paid' : booking.paymentStatus;
                    booking.status = 'completed';
                    booking.updatedAt = new Date();
                    return [4 /*yield*/, booking.save()];
                case 16:
                    _e.sent();
                    return [4 /*yield*/, booking.populate('packageId').populate('customerId')];
                case 17:
                    _e.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ success: true, data: booking })];
                case 18:
                    if (!(action === 'cancel')) return [3 /*break*/, 21];
                    booking.status = 'cancelled';
                    booking.updatedAt = new Date();
                    return [4 /*yield*/, booking.save()];
                case 19:
                    _e.sent();
                    return [4 /*yield*/, booking.populate('packageId').populate('customerId')];
                case 20:
                    _e.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ success: true, data: booking })];
                case 21: return [4 /*yield*/, DayOut_1.BoatRideBooking.findByIdAndUpdate(id, __assign(__assign({}, updateData), { updatedAt: new Date() }), { new: true })];
                case 22:
                    updated = _e.sent();
                    if (!updated) {
                        return [2 /*return*/, server_1.NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })];
                    }
                    return [4 /*yield*/, updated.populate('packageId').populate('customerId')];
                case 23:
                    _e.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ success: true, data: updated })];
                case 24:
                    error_3 = _e.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ success: false, error: error_3.message }, { status: 500 })];
                case 25: return [2 /*return*/];
            }
        });
    });
}
function DELETE(request) {
    return __awaiter(this, void 0, void 0, function () {
        var searchParams, id, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, (0, mongodb_1.connectDB)()];
                case 1:
                    _a.sent();
                    searchParams = new URL(request.url).searchParams;
                    id = searchParams.get('id');
                    if (!id) {
                        return [2 /*return*/, server_1.NextResponse.json({ success: false, error: 'Booking ID required' }, { status: 400 })];
                    }
                    return [4 /*yield*/, DayOut_1.BoatRideBooking.findByIdAndDelete(id)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ success: true, message: 'Boat booking deleted' })];
                case 3:
                    error_4 = _a.sent();
                    return [2 /*return*/, server_1.NextResponse.json({ success: false, error: error_4.message }, { status: 500 })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
