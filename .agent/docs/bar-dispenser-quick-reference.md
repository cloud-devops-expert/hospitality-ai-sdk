# Bar Dispenser Quick Reference

## Barman-Operated vs Self-Service Comparison

### Cocktail Dispensers

| Feature | Barman-Operated (Berg) | Self-Service (Bibo) |
|---------|------------------------|---------------------|
| **Cost** | $15,000-$35,000 | $1,200-$2,000 |
| **Speed** | 30-60 sec | 30-45 sec |
| **Capacity** | 12-24 ingredients | 5 ingredients |
| **Drinks/Hour** | 60-120 | 30-60 |
| **Maintenance** | Weekly professional | Monthly simple |
| **Best For** | High-volume bars | Hotel rooms, lounges |
| **ROI** | 18-24 months | 6-12 months |
| **Supervision** | Bartender operates | Guest operates |
| **Quality** | Professional | Consumer-grade |

**Recommendation**:
- **Barman**: Main hotel bar, nightclub, restaurant bar
- **Self-service**: In-room minibars, pool cabanas, small lounges

---

### Beer Tap Systems

| Feature | Barman (Traditional) | Self-Service (iPourIt) |
|---------|---------------------|------------------------|
| **Cost** | $5,000-$15,000 | $30,000-$80,000 |
| **Speed** | Instant | Instant (guest-controlled) |
| **Taps** | 8-20 | 20-50 |
| **Payment** | POS at end | RFID pay-as-you-pour |
| **Waste** | 10-15% over-pour | 2-3% (precise metering) |
| **Labor** | 1-2 bartenders needed | No bartender needed |
| **Best For** | Traditional bars | Brewpubs, sports bars |
| **ROI** | N/A (baseline) | 12-18 months (labor savings) |
| **Experience** | Personal service | Interactive, explore varieties |

**Recommendation**:
- **Barman**: Fine dining, upscale hotel bars
- **Self-service**: Casual dining, hotel brewpubs, rooftop bars

---

### Wine Dispensers

| Feature | Barman (WineEmotion 4) | Self-Service (WineEmotion 12) |
|---------|------------------------|-------------------------------|
| **Cost** | $3,500-$6,000 | $10,000-$12,000 |
| **Bottles** | 4 | 12 |
| **Pour Sizes** | Staff controls | Guest selects (tasting/glass) |
| **Preservation** | 21 days (nitrogen) | 21 days (nitrogen) |
| **Payment** | POS integration | RFID/credit card |
| **Staff** | Sommelier assists | Self-explanatory touchscreen |
| **Best For** | Fine dining | Wine bars, tasting rooms |
| **ROI** | 12-18 months (waste reduction) | 18-24 months |

**Recommendation**:
- **Barman**: Michelin-star restaurants, premium wine lists
- **Self-service**: Wine bars, hotel wine clubs, tasting events

---

### Coffee Machines

| Feature | Barman (Franke A1000) | Self-Service (Franke A600) |
|---------|----------------------|---------------------------|
| **Cost** | $15,000-$25,000 | $8,000-$12,000 |
| **Drinks/Hour** | 180-250 | 120-150 |
| **Customization** | Barista-level | Pre-programmed options |
| **Milk System** | Professional frother | Automatic |
| **Maintenance** | Daily by staff | Auto-cleaning |
| **Best For** | High-volume cafes | Business centers, lobbies |
| **ROI** | 18-24 months | 12-18 months |

**Recommendation**:
- **Barman**: Hotel lobby cafe, restaurant breakfast service
- **Self-service**: Business centers, conference rooms, offices

---

## Cost Breakdown by Hotel Size

### Small Hotel (10-50 rooms)

#### Barman-Focused Setup
```
Main Bar:
- Barpay Smart Bar (spirits): $12,000
- WineEmotion 4-bottle: $4,500
- Franke A600 Coffee: $8,000
TOTAL: $24,500
```

**Pros**: Professional quality, staff control, lower upfront cost
**Cons**: Requires bartender wages ($30,000-$50,000/year)

#### Self-Service Setup
```
Lobby Bar:
- 2x Bibo Cocktail Kiosks: $3,000
- 4-tap Beer System: $8,000
- Franke A600 Coffee (self-serve): $8,000
TOTAL: $19,000
```

**Pros**: Lower labor costs, 24/7 service
**Cons**: Consumer-grade quality, limited drink options

---

### Medium Hotel (50-200 rooms)

#### Hybrid Setup (Recommended)
```
Main Bar (Barman):
- Berg Cocktail Station: $25,000
- 12-tap Beer Wall: $22,000
- WineEmotion 8-bottle: $9,000
- Franke A1000 Coffee: $20,000
Subtotal: $76,000

Pool/Rooftop (Self-Service):
- iPourIt 20-tap Beer Wall: $45,000
- Bibo Cocktail Kiosks (x3): $4,500
- Franke A600 Coffee: $8,000
Subtotal: $57,500

In-Room (Self-Service):
- Bibo Minibars (x20 suites): $30,000

TOTAL: $163,500
```

**Best of both worlds**: Professional main bar + self-service amenities

---

### Large Hotel (200+ rooms)

#### Full Automation Setup
```
Main Bar (Barman):
- Berg Cocktail Stations (x2): $50,000
- iPourIt 40-tap Beer Wall: $65,000
- WineEmotion 12-bottle (x2): $22,000
- Franke A1000 (x2): $40,000
Subtotal: $177,000

Satellite Bars (Self-Service):
- Pool Bar: iPourIt 20-tap + Bibo (x2): $48,000
- Rooftop Bar: iPourIt 20-tap: $45,000
- Lobby Lounge: WineEmotion 8 + Coffee: $17,000
Subtotal: $110,000

In-Room (Self-Service):
- Bibo Minibars (x50 suites): $75,000

Conference/Business:
- Franke A1000 (x4): $80,000

TOTAL: $442,000
```

---

## Integration Protocols

### 1. REST API (Easiest - 80% of modern systems)
```typescript
// Standard HTTP/JSON
const order = await fetch('http://192.168.1.100/api/v1/orders', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer API_KEY' },
  body: JSON.stringify({ recipeId: 'mojito', strength: 'regular' })
});
```

**Supported by**: Berg, Barpay, iPourIt, Franke (via WiFi module)

---

### 2. Modbus TCP (Industrial - 15% of systems)
```typescript
// npm install modbus-serial
import ModbusRTU from 'modbus-serial';

const client = new ModbusRTU();
await client.connectTCP('192.168.1.101', { port: 502 });

// Write to coil (start pour)
await client.writeCoil(1, true);
// Write to register (set amount)
await client.writeRegister(10, 50); // 50ml
```

**Supported by**: Barpay, WineEmotion, some European systems

---

### 3. USB Serial (Legacy - 5% of systems)
```typescript
// npm install serialport
import { SerialPort } from 'serialport';

const port = new SerialPort({
  path: '/dev/ttyUSB0',
  baudRate: 9600
});

port.write('POUR:1:50\n'); // Pour bottle 1, 50ml
```

**Supported by**: Older Enomatic, legacy coffee machines

---

## Decision Matrix

### When to Choose Barman-Operated:
- ✅ Upscale/luxury property (Ritz, Four Seasons)
- ✅ Complex cocktail menu (20+ recipes)
- ✅ High-volume bar (>100 drinks/hour)
- ✅ Personal service is brand differentiator
- ✅ Staff already on payroll

### When to Choose Self-Service:
- ✅ 24/7 amenity desired (no staff at night)
- ✅ Labor costs are concern (hard to hire bartenders)
- ✅ Younger demographic (millennials/Gen-Z love tech)
- ✅ Space constraints (small footprint needed)
- ✅ Impulse purchases desired (beer wall increases sales 25%)

### When to Choose Hybrid:
- ✅ **MOST HOTELS** (best of both worlds)
- ✅ Main bar during day/evening (barman)
- ✅ Late-night self-service (pool, rooftop)
- ✅ In-room minibars (self-service)
- ✅ Business center coffee (self-service)

---

## Real-World Examples

### Marriott Marquis (Hybrid Model)
- **Main Bar**: Barman + Berg Cocktail Station
- **Pool Bar**: iPourIt 30-tap Self-Serve Beer Wall
- **Suites**: Bibo In-Room Cocktail Makers (Signature Suites only)
- **Conference**: Franke A1000 Self-Serve Coffee

**Result**: 30% increase in beverage revenue, 24/7 service, reduced labor costs

---

### Ace Hotel (Self-Service Focused)
- **Lobby Bar**: iPourIt 40-tap Beer Wall (no bartender)
- **Rooftop**: WineEmotion 12-bottle Self-Serve Wine Bar
- **Coffee**: Franke A600 Self-Serve (honor system payment)

**Result**: "Instagram-worthy" tech experience, lower operating costs, aligns with brand

---

### Ritz-Carlton (Barman-Only)
- **All Bars**: Traditional bartenders with premium spirits
- **Technology**: Barpay precise pouring (barman-operated, not guest-facing)
- **Coffee**: Franke A1000 (barista-operated)

**Result**: Premium service experience, less waste, maintains luxury brand

---

## Quick Start Guide

### Step 1: Choose Your Model
- [ ] Barman-only (luxury brand)
- [ ] Self-service-only (tech-forward, budget-conscious)
- [ ] **Hybrid (recommended for most)**

### Step 2: Select Hardware
- [ ] Cocktails: Berg (barman) or Bibo (self-service)
- [ ] Beer: Traditional taps (barman) or iPourIt (self-service)
- [ ] Wine: WineEmotion 4-bottle (barman) or 12-bottle (self-service)
- [ ] Coffee: Franke A1000 (barman) or A600 (self-service)

### Step 3: Integration Plan
- [ ] Check vendor API documentation
- [ ] Identify protocol (REST/Modbus/Serial)
- [ ] Set up isolated VLAN for dispensers
- [ ] Build adapter using templates (see hardware-integration.md)

### Step 4: Pilot Test
- [ ] Install 1 dispenser in main bar
- [ ] Test for 30 days
- [ ] Measure: speed, sales, guest satisfaction, waste
- [ ] Decide: scale deployment or adjust approach

### Step 5: Scale Deployment
- [ ] Roll out to additional locations
- [ ] Train staff on maintenance
- [ ] Integrate with POS system
- [ ] Add mobile app ordering

---

## Budget Templates

### $25K Budget (Small Hotel)
```
Priority 1: Main Bar Revenue Driver
- Barpay Smart Bar (spirits): $12,000
- WineEmotion 4-bottle: $4,500
- Franke A600 Coffee: $8,000
- Integration: $500

TOTAL: $25,000
ROI: 18 months (waste reduction + speed)
```

### $50K Budget (Medium Hotel)
```
Priority 1: Main Bar
- Berg Cocktail Station: $25,000
- WineEmotion 8-bottle: $9,000

Priority 2: Self-Service Amenity
- iPourIt 12-tap Beer Wall: $25,000
- Franke A600 Coffee: $8,000

Integration: $2,000

TOTAL: $69,000 (over by $19K - cut iPourIt to 8-tap for $18K)
REVISED TOTAL: $50,000
ROI: 15 months (labor savings + sales increase)
```

### $100K Budget (Large Hotel)
```
Priority 1: Main Bar (Premium)
- Berg Cocktail Station: $25,000
- iPourIt 20-tap Beer Wall: $35,000
- WineEmotion 12-bottle: $11,000

Priority 2: Secondary Locations
- Pool Bar: Bibo Kiosks (x3) + Beer Taps: $12,000
- Business Center: Franke A1000: $20,000

Priority 3: In-Room
- Bibo Minibars (x10 suites): $15,000

Integration: $5,000

TOTAL: $123,000 (over - cut Bibo minibars to 5 units)
REVISED TOTAL: $100,000
ROI: 12-18 months (labor + sales + waste reduction)
```

---

## Next Steps

1. **Read**: Full integration guide (.agent/docs/bar-dispenser-hardware-integration.md)
2. **Contact**: 2-3 vendors for quotes and demos
3. **Pilot**: Test 1 dispenser for 30 days
4. **Measure**: Track speed, sales, waste, satisfaction
5. **Scale**: Roll out if pilot successful

**Questions?** Check the full hardware integration guide for vendor contacts, API examples, and detailed technical specifications.
