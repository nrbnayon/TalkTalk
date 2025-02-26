"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../config"));
const getDistanceFromOriginDestination = (location) => __awaiter(void 0, void 0, void 0, function* () {
    const apiKey = config_1.default.google_maps;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${location === null || location === void 0 ? void 0 : location.origin.latitude},${location === null || location === void 0 ? void 0 : location.origin.longitude}&destinations=${location === null || location === void 0 ? void 0 : location.destinations.latitude},${location === null || location === void 0 ? void 0 : location.destinations.longitude}&key=${apiKey}`;
    try {
        const response = yield axios_1.default.get(url);
        const data = response.data;
        if (data.rows[0].elements[0].status === 'OK') {
            const distance = data.rows[0].elements[0].distance.text;
            return distance;
        }
        else {
            return;
        }
    }
    catch (error) {
        return;
    }
});
exports.default = getDistanceFromOriginDestination;
