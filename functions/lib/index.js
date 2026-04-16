"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsVerify = exports.smsSend = exports.notifyTradeDispute = exports.notifyTradeMessage = exports.createTradeOffer = exports.cancelTradeOffer = exports.rejectTradeOffer = exports.payTradeCashDifference = exports.completeTradeOffer = exports.acceptTradeOffer = exports.markDelivered = exports.openDispute = exports.confirmDelivery = exports.mockCapturePayment = exports.mockPaymentWebhook = exports.createPaymentIntent = exports.testSMTPConnection = exports.sendWelcomeEmail = exports.checkEmailVerificationStatus = exports.verifyPasswordResetCode = exports.sendPasswordResetEmail = exports.resendVerificationEmail = exports.verifyEmailCode = exports.sendVerificationEmail = exports.shopierWebhook = exports.createShopierCheckout = exports.prepareShopierBatchOrders = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const escrow_1 = require("./payment/escrow");
(0, v2_1.setGlobalOptions)({ region: "europe-west1" });
admin.initializeApp();
const db = admin.firestore();
var shopierHandlers_1 = require("./payment/shopierHandlers");
Object.defineProperty(exports, "prepareShopierBatchOrders", { enumerable: true, get: function () { return shopierHandlers_1.prepareShopierBatchOrders; } });
Object.defineProperty(exports, "createShopierCheckout", { enumerable: true, get: function () { return shopierHandlers_1.createShopierCheckout; } });
Object.defineProperty(exports, "shopierWebhook", { enumerable: true, get: function () { return shopierHandlers_1.shopierWebhook; } });
var email_1 = require("./email");
Object.defineProperty(exports, "sendVerificationEmail", { enumerable: true, get: function () { return email_1.sendVerificationEmail; } });
Object.defineProperty(exports, "verifyEmailCode", { enumerable: true, get: function () { return email_1.verifyEmailCode; } });
Object.defineProperty(exports, "resendVerificationEmail", { enumerable: true, get: function () { return email_1.resendVerificationEmail; } });
Object.defineProperty(exports, "sendPasswordResetEmail", { enumerable: true, get: function () { return email_1.sendPasswordResetEmail; } });
Object.defineProperty(exports, "verifyPasswordResetCode", { enumerable: true, get: function () { return email_1.verifyPasswordResetCode; } });
Object.defineProperty(exports, "checkEmailVerificationStatus", { enumerable: true, get: function () { return email_1.checkEmailVerificationStatus; } });
Object.defineProperty(exports, "sendWelcomeEmail", { enumerable: true, get: function () { return email_1.sendWelcomeEmail; } });
Object.defineProperty(exports, "testSMTPConnection", { enumerable: true, get: function () { return email_1.testSMTPConnection; } });
// SSR for SEO
// export { ssr, botSsr } from './ssr';
// -----------------------------------------------------------------------------
// Mock Payment Intent + Webhook (provider erişimi gelene kadar)
// -----------------------------------------------------------------------------
exports.createPaymentIntent = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    const { orderId, amountCents } = (request.data || {});
    if (!orderId || typeof orderId !== "string")
        throw new https_1.HttpsError("invalid-argument", "orderId required");
    if (!Number.isInteger(amountCents) || amountCents <= 0)
        throw new https_1.HttpsError("invalid-argument", "amountCents must be positive int");
    const amountCentsNum = amountCents;
    const intentRef = db.collection("paymentIntents").doc();
    await intentRef.set({
        userId: uid,
        orderId,
        amount: amountCentsNum / 100,
        amountCents: amountCentsNum,
        currency: "TRY",
        method: "card",
        status: "requires_action",
        provider: "mock",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    // mock yönlendirme linki (frontend bunu kullanıp "ödemeyi tamamla" simüle edebilir)
    return { intentId: intentRef.id };
});
exports.mockPaymentWebhook = (0, https_1.onRequest)(async (req, res) => {
    if (req.method !== "POST")
        return res.status(405).send("Method Not Allowed");
    const { intentId, status } = (req.body || {});
    if (!intentId || typeof intentId !== "string")
        return res.status(400).send("intentId required");
    if (!status || typeof status !== "string")
        return res.status(400).send("status required");
    const intentRef = db.collection("paymentIntents").doc(intentId);
    const intentSnap = await intentRef.get();
    if (!intentSnap.exists)
        return res.status(404).send("intent not found");
    const intent = intentSnap.data();
    const orderId = String(intent.orderId || "");
    if (!orderId)
        return res.status(400).send("intent missing orderId");
    // paid -> escrow hold
    if (status === "captured") {
        await db.runTransaction(async (tx) => {
            tx.update(intentRef, {
                status: "captured",
                capturedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            const orderRef = db.collection("orders").doc(orderId);
            const orderSnap = await tx.get(orderRef);
            if (!orderSnap.exists)
                throw new Error("order not found");
            const order = orderSnap.data();
            if (order.buyerId !== intent.userId)
                throw new Error("buyer mismatch");
            tx.update(orderRef, {
                paymentStatus: "captured",
                status: "paid",
                escrowStatus: "held",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // hold funds for seller (held ledger)
            const sellerId = String(order.sellerId || "");
            const amountCents = Number(intent.amountCents || 0);
            if (!sellerId || !Number.isInteger(amountCents) || amountCents <= 0)
                throw new Error("invalid order");
            const sellerRef = db.collection("users").doc(sellerId);
            tx.set(sellerRef, {
                balanceHeldCents: admin.firestore.FieldValue.increment(amountCents),
            }, { merge: true });
        });
    }
    else if (status === "failed") {
        await intentRef.update({ status: "failed" });
    }
    return res.json({ ok: true });
});
exports.mockCapturePayment = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    const { intentId } = (request.data || {});
    if (!intentId || typeof intentId !== "string")
        throw new https_1.HttpsError("invalid-argument", "intentId required");
    const intentRef = db.collection("paymentIntents").doc(intentId);
    await db.runTransaction(async (tx) => {
        const intentSnap = await tx.get(intentRef);
        if (!intentSnap.exists)
            throw new https_1.HttpsError("not-found", "intent not found");
        const intent = intentSnap.data();
        if (intent.userId !== uid)
            throw new https_1.HttpsError("permission-denied", "not owner");
        const orderId = String(intent.orderId || "");
        if (!orderId)
            throw new https_1.HttpsError("failed-precondition", "intent missing orderId");
        const orderRef = db.collection("orders").doc(orderId);
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists)
            throw new https_1.HttpsError("not-found", "order not found");
        const order = orderSnap.data();
        if (order.buyerId !== uid)
            throw new https_1.HttpsError("permission-denied", "buyer mismatch");
        const amountCents = Number(intent.amountCents ||
            order.amountCents ||
            Math.round(Number(order.price || 0) * 100));
        const sellerId = String(order.sellerId || "");
        if (!sellerId || !Number.isInteger(amountCents) || amountCents <= 0) {
            throw new https_1.HttpsError("failed-precondition", "invalid order");
        }
        (0, escrow_1.applyEscrowHoldInTransaction)(tx, db, {
            orderRef,
            order,
            buyerUserId: uid,
            amountCents,
            intentRef,
        });
    });
    return { status: "captured" };
});
// -----------------------------------------------------------------------------
// Order actions: confirm delivery / dispute (client direct write yerine)
// -----------------------------------------------------------------------------
exports.confirmDelivery = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    const { orderId } = (request.data || {});
    if (!orderId || typeof orderId !== "string")
        throw new https_1.HttpsError("invalid-argument", "orderId required");
    await db.runTransaction(async (tx) => {
        const orderRef = db.collection("orders").doc(orderId);
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists)
            throw new https_1.HttpsError("not-found", "order not found");
        const order = orderSnap.data();
        if (order.buyerId !== uid)
            throw new https_1.HttpsError("permission-denied", "not buyer");
        if (order.status === "disputed")
            throw new https_1.HttpsError("failed-precondition", "order disputed");
        if (order.escrowStatus !== "held")
            throw new https_1.HttpsError("failed-precondition", "escrow not held");
        const sellerId = String(order.sellerId || "");
        const amountCents = Number(order.amountCents || Math.round(Number(order.price || 0) * 100));
        if (!sellerId || !Number.isInteger(amountCents) || amountCents <= 0)
            throw new https_1.HttpsError("failed-precondition", "invalid order amount");
        const sellerRef = db.collection("users").doc(sellerId);
        tx.set(sellerRef, {
            balanceHeldCents: admin.firestore.FieldValue.increment(-amountCents),
            balanceAvailableCents: admin.firestore.FieldValue.increment(amountCents),
        }, { merge: true });
        tx.update(orderRef, {
            status: "completed",
            escrowStatus: "released",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        tx.set(db.collection("transactions").doc(), {
            userId: sellerId,
            type: "escrow_release",
            amount: amountCents / 100,
            amountCents,
            direction: "credit",
            refId: orderId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            meta: { buyerId: uid },
        });
    });
    return { ok: true };
});
exports.openDispute = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    const { orderId, reason } = (request.data || {});
    if (!orderId || typeof orderId !== "string")
        throw new https_1.HttpsError("invalid-argument", "orderId required");
    await db.runTransaction(async (tx) => {
        const orderRef = db.collection("orders").doc(orderId);
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists)
            throw new https_1.HttpsError("not-found", "order not found");
        const order = orderSnap.data();
        const isBuyer = order.buyerId === uid;
        const isSeller = order.sellerId === uid;
        if (!isBuyer && !isSeller)
            throw new https_1.HttpsError("permission-denied", "not participant");
        if (order.status === "completed")
            throw new https_1.HttpsError("failed-precondition", "order completed");
        tx.update(orderRef, {
            status: "disputed",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        tx.set(db.collection("disputes").doc(), {
            orderId,
            buyerId: order.buyerId,
            sellerId: order.sellerId,
            reason: String(reason || "Uyuşmazlık bildirildi."),
            status: "open",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    return { ok: true };
});
exports.markDelivered = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    const { orderId } = (request.data || {});
    if (!orderId || typeof orderId !== "string")
        throw new https_1.HttpsError("invalid-argument", "orderId required");
    await db.runTransaction(async (tx) => {
        const orderRef = db.collection("orders").doc(orderId);
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists)
            throw new https_1.HttpsError("not-found", "order not found");
        const order = orderSnap.data();
        if (String(order.sellerId || "") !== uid)
            throw new https_1.HttpsError("permission-denied", "not seller");
        if (order.status === "disputed")
            throw new https_1.HttpsError("failed-precondition", "order disputed");
        tx.update(orderRef, {
            status: "delivered",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    return { ok: true };
});
// -----------------------------------------------------------------------------
// Trade System Actions
// -----------------------------------------------------------------------------
exports.acceptTradeOffer = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    }
    const { offerId } = request.data;
    if (!offerId) {
        throw new https_1.HttpsError("invalid-argument", "offerId is required.");
    }
    const offerRef = db.collection("trade_offers").doc(offerId);
    await db.runTransaction(async (tx) => {
        const offerSnap = await tx.get(offerRef);
        if (!offerSnap.exists) {
            throw new https_1.HttpsError("not-found", "Trade offer not found.");
        }
        const offer = offerSnap.data();
        if (offer.receiverUserId !== uid) {
            throw new https_1.HttpsError("permission-denied", "Only the receiver can accept this offer.");
        }
        if (!["pending", "viewed"].includes(String(offer.status || ""))) {
            throw new https_1.HttpsError("failed-precondition", "Only pending or viewed offers can be accepted.");
        }
        const itemsQuery = db
            .collection("trade_offer_items")
            .where("tradeOfferId", "==", offerId);
        const itemsSnap = await tx.get(itemsQuery);
        if (itemsSnap.empty) {
            throw new https_1.HttpsError("failed-precondition", "No trade items found for this offer.");
        }
        const items = itemsSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        const targetItem = items.find((item) => item.isTarget === true);
        const offeredItems = items.filter((item) => item.isTarget !== true);
        if (!targetItem) {
            throw new https_1.HttpsError("failed-precondition", "Target listing not found in trade items.");
        }
        if (offeredItems.length === 0 && Number(offer.offeredCashAmount || 0) <= 0) {
            throw new https_1.HttpsError("failed-precondition", "Trade must include item or cash.");
        }
        const targetListingId = String(targetItem.listingId || "");
        if (!targetListingId) {
            throw new https_1.HttpsError("failed-precondition", "Target listingId missing.");
        }
        const targetListingRef = db.collection("products").doc(targetListingId);
        const targetListingSnap = await tx.get(targetListingRef);
        if (!targetListingSnap.exists) {
            throw new https_1.HttpsError("not-found", "Target listing not found.");
        }
        const targetListing = targetListingSnap.data();
        if (targetListing.sellerId !== uid) {
            throw new https_1.HttpsError("permission-denied", "Receiver does not own target listing.");
        }
        if (targetListing.status !== "active") {
            throw new https_1.HttpsError("failed-precondition", "Target listing is not active.");
        }
        const offeredListingRefs = offeredItems.map((item) => db.collection("products").doc(String(item.listingId)));
        const offeredListingSnaps = await Promise.all(offeredListingRefs.map((ref) => tx.get(ref)));
        offeredListingSnaps.forEach((snap, i) => {
            if (!snap.exists) {
                throw new https_1.HttpsError("not-found", `Offered listing not found: ${offeredItems[i].listingId}`);
            }
            const listing = snap.data();
            if (listing.sellerId !== offer.senderUserId) {
                throw new https_1.HttpsError("failed-precondition", `Offered listing owner mismatch: ${offeredItems[i].listingId}`);
            }
            if (listing.status !== "active") {
                throw new https_1.HttpsError("failed-precondition", `Offered listing is not active: ${offeredItems[i].listingId}`);
            }
        });
        tx.update(offerRef, {
            status: "accepted",
            acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        tx.set(db.collection("trade_status_history").doc(), {
            offerId,
            oldStatus: "pending",
            newStatus: "accepted",
            changedBy: uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        tx.update(targetListingRef, {
            status: "locked",
            lockedByTradeId: offerId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        for (const ref of offeredListingRefs) {
            tx.update(ref, {
                status: "locked",
                lockedByTradeId: offerId,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        tx.set(db.collection("notifications").doc(), {
            userId: offer.senderUserId,
            type: "trade",
            title: "Takas teklifi kabul edildi",
            message: "Gönderdiğiniz takas teklifi kabul edildi.",
            tradeOfferId: offerId,
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    return { ok: true };
});
exports.completeTradeOffer = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    }
    const { offerId } = request.data;
    if (!offerId) {
        throw new https_1.HttpsError("invalid-argument", "offerId is required.");
    }
    const offerRef = db.collection("trade_offers").doc(offerId);
    await db.runTransaction(async (tx) => {
        const offerSnap = await tx.get(offerRef);
        if (!offerSnap.exists) {
            throw new https_1.HttpsError("not-found", "Trade offer not found.");
        }
        const offer = offerSnap.data();
        const isSender = offer.senderUserId === uid;
        const isReceiver = offer.receiverUserId === uid;
        if (!isSender && !isReceiver) {
            throw new https_1.HttpsError("permission-denied", "You are not part of this trade.");
        }
        if (offer.status !== "accepted") {
            throw new https_1.HttpsError("failed-precondition", "Only accepted trades can be completed.");
        }
        const nextSenderConfirmed = isSender ? true : !!offer.senderConfirmed;
        const nextReceiverConfirmed = isReceiver ? true : !!offer.receiverConfirmed;
        const partialUpdate = {
            senderConfirmed: nextSenderConfirmed,
            receiverConfirmed: nextReceiverConfirmed,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const bothConfirmed = nextSenderConfirmed && nextReceiverConfirmed;
        tx.update(offerRef, bothConfirmed ? {
            ...partialUpdate,
            status: "completed",
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
        } : partialUpdate);
        tx.set(db.collection("trade_status_history").doc(), {
            tradeOfferId: offerId,
            oldStatus: bothConfirmed ? "accepted" : offer.status,
            newStatus: bothConfirmed ? "completed" : "delivery_confirmed",
            changedBy: uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        if (!bothConfirmed) {
            const otherUserId = isSender ? offer.receiverUserId : offer.senderUserId;
            tx.set(db.collection("notifications").doc(), {
                userId: otherUserId,
                type: "trade",
                title: "Takas teslim onayı bekliyor",
                message: "Karşı taraf teslimatı onayladı. İşlemi tamamlamak için siz de onay verin.",
                tradeOfferId: offerId,
                isRead: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return;
        }
        const itemsQuery = db.collection("trade_offer_items").where("tradeOfferId", "==", offerId);
        const itemsSnap = await tx.get(itemsQuery);
        if (itemsSnap.empty) {
            throw new https_1.HttpsError("failed-precondition", "No trade items found.");
        }
        const items = itemsSnap.docs.map((doc) => doc.data());
        const listingIds = items.map((item) => String(item.listingId || "")).filter(Boolean);
        if (listingIds.length === 0) {
            throw new https_1.HttpsError("failed-precondition", "No listing ids found.");
        }
        const listingRefs = listingIds.map((id) => db.collection("products").doc(id));
        const listingSnaps = await Promise.all(listingRefs.map((ref) => tx.get(ref)));
        listingSnaps.forEach((snap, i) => {
            if (!snap.exists) {
                throw new https_1.HttpsError("not-found", `Listing not found: ${listingIds[i]}`);
            }
        });
        for (const ref of listingRefs) {
            tx.update(ref, {
                status: "sold",
                lockedByTradeId: admin.firestore.FieldValue.delete(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        tx.set(db.collection("notifications").doc(), {
            userId: offer.senderUserId,
            type: "trade",
            title: "Takas tamamlandı",
            message: "Takas işlemi iki tarafın onayıyla tamamlandı.",
            tradeOfferId: offerId,
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        tx.set(db.collection("notifications").doc(), {
            userId: offer.receiverUserId,
            type: "trade",
            title: "Takas tamamlandı",
            message: "Takas işlemi iki tarafın onayıyla tamamlandı.",
            tradeOfferId: offerId,
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    return { ok: true };
});
exports.payTradeCashDifference = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    const { offerId } = (request.data || {});
    if (!offerId || typeof offerId !== "string")
        throw new https_1.HttpsError("invalid-argument", "offerId required");
    await db.runTransaction(async (tx) => {
        const offerRef = db.collection("trade_offers").doc(offerId);
        const offerSnap = await tx.get(offerRef);
        if (!offerSnap.exists)
            throw new https_1.HttpsError("not-found", "offer not found");
        const offer = offerSnap.data();
        if (offer.senderUserId !== uid)
            throw new https_1.HttpsError("permission-denied", "not sender");
        if (offer.status !== "accepted")
            throw new https_1.HttpsError("failed-precondition", "offer not accepted");
        if (offer.cashPaid)
            throw new https_1.HttpsError("failed-precondition", "cash already paid");
        if (!offer.offeredCashAmount || offer.offeredCashAmount <= 0)
            throw new https_1.HttpsError("failed-precondition", "no cash to pay");
        const userRef = db.collection("users").doc(uid);
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists)
            throw new https_1.HttpsError("not-found", "user not found");
        const userData = userSnap.data();
        if ((userData.balance || 0) < offer.offeredCashAmount) {
            throw new https_1.HttpsError("failed-precondition", "insufficient-balance");
        }
        // Deduct balance
        tx.update(userRef, {
            balance: admin.firestore.FieldValue.increment(-offer.offeredCashAmount),
        });
        // Record transaction
        const txRef = db.collection("transactions").doc();
        tx.set(txRef, {
            userId: uid,
            type: "trade_payment",
            amount: -offer.offeredCashAmount,
            status: "completed",
            relatedId: offerId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Update offer
        tx.update(offerRef, {
            cashPaid: true,
            cashPaidAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    return { ok: true };
});
exports.rejectTradeOffer = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    const { offerId } = (request.data || {});
    if (!offerId || typeof offerId !== "string")
        throw new https_1.HttpsError("invalid-argument", "offerId required");
    await db.runTransaction(async (tx) => {
        const offerRef = db.collection("trade_offers").doc(offerId);
        const offerSnap = await tx.get(offerRef);
        if (!offerSnap.exists)
            throw new https_1.HttpsError("not-found", "offer not found");
        const offer = offerSnap.data();
        if (offer.receiverUserId !== uid)
            throw new https_1.HttpsError("permission-denied", "not receiver");
        if (offer.status !== "pending" && offer.status !== "viewed")
            throw new https_1.HttpsError("failed-precondition", "offer cannot be rejected");
        tx.update(offerRef, {
            status: "rejected",
            lastActionBy: uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        const historyRef = db.collection("trade_status_history").doc();
        tx.set(historyRef, {
            tradeOfferId: offerId,
            oldStatus: offer.status,
            newStatus: "rejected",
            changedBy: uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        const notifRef = db.collection("notifications").doc();
        tx.set(notifRef, {
            userId: offer.senderUserId,
            type: "info",
            title: "Takas Teklifi Reddedildi",
            message: "Takas teklifiniz reddedildi.",
            isRead: false,
            link: `/trade/offers/${offerId}`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    return { ok: true };
});
exports.cancelTradeOffer = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    const { offerId } = (request.data || {});
    if (!offerId || typeof offerId !== "string")
        throw new https_1.HttpsError("invalid-argument", "offerId required");
    await db.runTransaction(async (tx) => {
        const offerRef = db.collection("trade_offers").doc(offerId);
        const offerSnap = await tx.get(offerRef);
        if (!offerSnap.exists)
            throw new https_1.HttpsError("not-found", "offer not found");
        const offer = offerSnap.data();
        if (offer.senderUserId !== uid)
            throw new https_1.HttpsError("permission-denied", "not sender");
        if (offer.status !== "pending" && offer.status !== "viewed")
            throw new https_1.HttpsError("failed-precondition", "offer cannot be cancelled");
        tx.update(offerRef, {
            status: "cancelled",
            lastActionBy: uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        const historyRef = db.collection("trade_status_history").doc();
        tx.set(historyRef, {
            tradeOfferId: offerId,
            oldStatus: offer.status,
            newStatus: "cancelled",
            changedBy: uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        const notifRef = db.collection("notifications").doc();
        tx.set(notifRef, {
            userId: offer.receiverUserId,
            type: "info",
            title: "Takas Teklifi İptal Edildi",
            message: "Karşı taraf takas teklifini iptal etti.",
            isRead: false,
            link: `/trade/offers/${offerId}`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    return { ok: true };
});
exports.createTradeOffer = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    const { targetListingId, offeredListingIds, cashOffer, message, counterOfferId, } = request.data;
    if (!targetListingId)
        throw new https_1.HttpsError("invalid-argument", "targetListingId required");
    let newOfferId = "";
    await db.runTransaction(async (tx) => {
        const targetRef = db.collection("products").doc(targetListingId);
        const targetSnap = await tx.get(targetRef);
        if (!targetSnap.exists)
            throw new https_1.HttpsError("not-found", "target listing not found");
        const target = targetSnap.data();
        if (!target.isTradeAllowed)
            throw new https_1.HttpsError("failed-precondition", "trade not allowed");
        if (target.sellerId === uid)
            throw new https_1.HttpsError("failed-precondition", "cannot trade with self");
        // Check daily limit
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dailyQ = db
            .collection("trade_offers")
            .where("senderUserId", "==", uid)
            .where("createdAt", ">=", today);
        const dailySnap = await tx.get(dailyQ);
        if (dailySnap.size >= 10)
            throw new https_1.HttpsError("resource-exhausted", "daily limit reached");
        // Check existing
        const existingQ = db
            .collection("trade_offers")
            .where("senderUserId", "==", uid)
            .where("targetListingId", "==", targetListingId)
            .where("status", "in", ["pending", "viewed"]);
        const existingSnap = await tx.get(existingQ);
        if (!existingSnap.empty)
            throw new https_1.HttpsError("already-exists", "active offer exists");
        const offerRef = db.collection("trade_offers").doc();
        newOfferId = offerRef.id;
        tx.set(offerRef, {
            targetListingId,
            senderUserId: uid,
            receiverUserId: target.sellerId,
            offeredCashAmount: Number(cashOffer) || 0,
            requestedCashAmount: 0,
            message: String(message || "").trim(),
            status: "pending",
            lastActionBy: uid,
            parentOfferId: counterOfferId || null,
            expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 3 * 24 * 60 * 60 * 1000),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        if (counterOfferId) {
            const counterRef = db.collection("trade_offers").doc(counterOfferId);
            tx.update(counterRef, {
                status: "countered",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            tx.set(db.collection("trade_status_history").doc(), {
                tradeOfferId: counterOfferId,
                oldStatus: "pending",
                newStatus: "countered",
                changedBy: uid,
                note: "Karşı teklif oluşturuldu",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        // Add target item
        tx.set(db.collection("trade_offer_items").doc(), {
            tradeOfferId: newOfferId,
            listingId: targetListingId,
            ownerUserId: target.sellerId,
            declaredValue: target.price || 0,
            isTarget: true,
        });
        // Add offered items
        if (Array.isArray(offeredListingIds)) {
            for (const listingId of offeredListingIds) {
                const itemRef = db.collection("products").doc(listingId);
                const itemSnap = await tx.get(itemRef);
                if (itemSnap.exists) {
                    const item = itemSnap.data();
                    if (item.sellerId === uid && item.status === 'active' && String(item.id || listingId) !== String(targetListingId)) {
                        tx.set(db.collection("trade_offer_items").doc(), {
                            tradeOfferId: newOfferId,
                            listingId,
                            ownerUserId: uid,
                            declaredValue: item.price || 0,
                        });
                    }
                }
            }
        }
        tx.set(db.collection("trade_status_history").doc(), {
            tradeOfferId: newOfferId,
            oldStatus: null,
            newStatus: "pending",
            changedBy: uid,
            note: counterOfferId
                ? "Karşı teklif olarak oluşturuldu"
                : "Teklif oluşturuldu",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        tx.set(db.collection("notifications").doc(), {
            userId: target.sellerId,
            type: "info",
            title: counterOfferId ? "Yeni Karşı Teklif" : "Yeni Takas Teklifi",
            message: counterOfferId
                ? `${target.title} ilanınız için bir karşı teklif aldınız.`
                : `${target.title} ilanınız için yeni bir takas teklifi aldınız.`,
            isRead: false,
            link: `/trade/offers/${newOfferId}`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    return { offerId: newOfferId };
});
exports.notifyTradeMessage = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    const { offerId, message } = request.data;
    if (!offerId)
        throw new https_1.HttpsError("invalid-argument", "offerId required");
    const offerRef = db.collection("trade_offers").doc(offerId);
    const offerSnap = await offerRef.get();
    if (!offerSnap.exists)
        throw new https_1.HttpsError("not-found", "offer not found");
    const offer = offerSnap.data();
    if (offer.senderUserId !== uid && offer.receiverUserId !== uid) {
        throw new https_1.HttpsError("permission-denied", "not participant");
    }
    const otherUserId = uid === offer.senderUserId ? offer.receiverUserId : offer.senderUserId;
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data();
    await db.collection("notifications").add({
        userId: otherUserId,
        type: "info",
        title: "Yeni Takas Mesajı",
        message: `${userData?.username || "Kullanıcı"} size bir mesaj gönderdi.`,
        isRead: false,
        link: `/trade/offers/${offerId}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true };
});
exports.notifyTradeDispute = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    const { offerId } = request.data;
    if (!offerId)
        throw new https_1.HttpsError("invalid-argument", "offerId required");
    const offerRef = db.collection("trade_offers").doc(offerId);
    const offerSnap = await offerRef.get();
    if (!offerSnap.exists)
        throw new https_1.HttpsError("not-found", "offer not found");
    const offer = offerSnap.data();
    if (offer.senderUserId !== uid && offer.receiverUserId !== uid) {
        throw new https_1.HttpsError("permission-denied", "not participant");
    }
    const otherUserId = uid === offer.senderUserId ? offer.receiverUserId : offer.senderUserId;
    await db.collection("notifications").add({
        userId: otherUserId,
        type: "warning",
        title: "Takas Uyuşmazlığı Bildirildi",
        message: "Bu takas için bir uyuşmazlık kaydı oluşturuldu. Destek ekibi inceleyecektir.",
        isRead: false,
        link: `/trade/offers/${offerId}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true };
});
// -----------------------------------------------------------------------------
// SMS OTP (mock): provider erişimi gelene kadar emulator-friendly
// -----------------------------------------------------------------------------
exports.smsSend = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    const { phone } = (request.data || {});
    const clean = String(phone || "")
        .replace(/[^\d+]/g, "")
        .trim();
    if (clean.length < 8)
        throw new https_1.HttpsError("invalid-argument", "phone required");
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const otpRef = db.collection("smsOtps").doc();
    await otpRef.set({
        userId: uid,
        phone: clean,
        code,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 5 * 60 * 1000),
    });
    const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
    return { ok: true, devCode: isEmulator ? code : null };
});
exports.smsVerify = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    const { phone, code } = (request.data || {});
    const clean = String(phone || "")
        .replace(/[^\d+]/g, "")
        .trim();
    const c = String(code || "").trim();
    if (clean.length < 8)
        throw new https_1.HttpsError("invalid-argument", "phone required");
    if (!/^\d{6}$/.test(c))
        throw new https_1.HttpsError("invalid-argument", "code must be 6 digits");
    // Find latest OTP for this user+phone
    const snap = await db
        .collection("smsOtps")
        .where("userId", "==", uid)
        .where("phone", "==", clean)
        .orderBy("expiresAt", "desc")
        .limit(1)
        .get();
    if (snap.empty)
        throw new https_1.HttpsError("failed-precondition", "otp not found");
    const doc0 = snap.docs[0];
    const otp = doc0.data();
    if (otp.code !== c)
        throw new https_1.HttpsError("permission-denied", "invalid code");
    if (otp.expiresAt?.toMillis && otp.expiresAt.toMillis() < Date.now())
        throw new https_1.HttpsError("deadline-exceeded", "code expired");
    await db.runTransaction(async (tx) => {
        tx.delete(doc0.ref);
        tx.set(db.collection("users").doc(uid), { smsVerified: true, phone: clean, withdrawEnabled: true }, { merge: true });
    });
    return { ok: true };
});
