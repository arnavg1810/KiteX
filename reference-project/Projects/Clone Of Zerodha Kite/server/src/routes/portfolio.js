const express = require('express');
const Portfolio = require('../models/Portfolio');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const stockService = require('../services/stockService');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) {
      portfolio = await Portfolio.create({ user: req.user._id, holdings: [] });
    }

    // Enrich holdings with live prices
    const enrichedHoldings = await Promise.all(
      portfolio.holdings.map(async (h) => {
        const quote = await stockService.getQuote(h.symbol);
        const currentValue = quote.close * h.quantity;
        const pnl = currentValue - h.investedValue;
        const pnlPercent = (pnl / h.investedValue) * 100;

        return {
          symbol: h.symbol,
          name: h.name,
          quantity: h.quantity,
          avgPrice: h.avgPrice,
          investedValue: h.investedValue,
          currentPrice: quote.close,
          currentValue,
          pnl: Math.round(pnl * 100) / 100,
          pnlPercent: Math.round(pnlPercent * 100) / 100,
          dayChange: quote.change,
          dayChangePercent: quote.changePercent,
        };
      })
    );

    const totalInvested = enrichedHoldings.reduce((s, h) => s + h.investedValue, 0);
    const totalCurrent = enrichedHoldings.reduce((s, h) => s + h.currentValue, 0);
    const totalPnL = totalCurrent - totalInvested;
    const dayPnL = enrichedHoldings.reduce((s, h) => s + (h.dayChange * h.quantity), 0);

    res.json({
      holdings: enrichedHoldings,
      summary: {
        totalInvested: Math.round(totalInvested * 100) / 100,
        totalCurrent: Math.round(totalCurrent * 100) / 100,
        totalPnL: Math.round(totalPnL * 100) / 100,
        totalPnLPercent: totalInvested ? Math.round((totalPnL / totalInvested) * 10000) / 100 : 0,
        dayPnL: Math.round(dayPnL * 100) / 100,
        balance: req.user.balance,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/order', protect, async (req, res) => {
  try {
    const { symbol, type, quantity, orderType = 'MARKET' } = req.body;

    if (!symbol || !type || !quantity) {
      return res.status(400).json({ error: 'symbol, type, and quantity are required' });
    }

    const quote = await stockService.getQuote(symbol.toUpperCase());
    const price = quote.close;
    const totalCost = price * quantity;

    const user = await User.findById(req.user._id);
    let portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) {
      portfolio = await Portfolio.create({ user: req.user._id, holdings: [] });
    }

    if (type === 'BUY') {
      if (user.balance < totalCost) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      user.balance -= totalCost;

      const existingHolding = portfolio.holdings.find((h) => h.symbol === symbol.toUpperCase());
      if (existingHolding) {
        const newQty = existingHolding.quantity + quantity;
        existingHolding.avgPrice = (existingHolding.investedValue + totalCost) / newQty;
        existingHolding.quantity = newQty;
        existingHolding.investedValue += totalCost;
      } else {
        const stock = require('../config/nifty50').NIFTY_50_STOCKS.find(
          (s) => s.symbol === symbol.toUpperCase()
        );
        portfolio.holdings.push({
          symbol: symbol.toUpperCase(),
          name: stock?.name || symbol,
          quantity,
          avgPrice: price,
          investedValue: totalCost,
        });
      }
    } else if (type === 'SELL') {
      const holding = portfolio.holdings.find((h) => h.symbol === symbol.toUpperCase());
      if (!holding || holding.quantity < quantity) {
        return res.status(400).json({ error: 'Insufficient holdings' });
      }

      user.balance += totalCost;
      holding.quantity -= quantity;
      holding.investedValue = holding.avgPrice * holding.quantity;

      if (holding.quantity === 0) {
        portfolio.holdings = portfolio.holdings.filter((h) => h.symbol !== symbol.toUpperCase());
      }
    }

    await user.save();
    await portfolio.save();

    const order = await Order.create({
      user: req.user._id,
      symbol: symbol.toUpperCase(),
      name: quote.name,
      type,
      orderType,
      quantity,
      price,
      status: 'EXECUTED',
    });

    res.json({
      order,
      balance: user.balance,
      message: `${type} order executed: ${quantity} x ${symbol.toUpperCase()} @ ₹${price.toFixed(2)}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
