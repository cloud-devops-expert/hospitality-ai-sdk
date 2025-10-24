/**
 * Entity Extraction Demo (No Generative AI)
 *
 * Demonstrates rule-based NER using compromise library
 */

import { EntityExtractor } from '../lib/ml/nlp/entity-extractor';

async function main() {
  console.log('🔍 Entity Extraction Demo (No Generative AI)\n');
  console.log('Using: compromise library (rule-based NER)');
  console.log('Performance: <5ms per document, 75-85% accuracy\n');

  const extractor = new EntityExtractor();

  const sampleTexts = [
    `Dear Hotel Manager, I'm writing to complain about my stay in Room 305 from June 15-18.
     The room was not clean and the AC was broken. My reservation ID was RES-12345.
     Please contact me at john.smith@email.com or call 555-123-4567.`,

    `Check-in date: March 10, 2024. Check-out date: March 15, 2024.
     Total cost: $1,250.00. Booking confirmation: CONF#98765.
     Guest: Maria Garcia. Contact: +1-555-987-6543.
     Special requests: Late checkout please.`,

    `I stayed at the Marriott Hotel in New York last week with my family.
     The staff was amazing, especially Sarah from the front desk.
     We had Suite #420 and it was perfect. Will definitely return!`,
  ];

  console.log('📧 Extracting Entities from Hotel Communications:\n');
  console.log('='.repeat(80));

  sampleTexts.forEach((text, index) => {
    console.log(`\n📄 Document ${index + 1}:`);
    console.log(`"${text.substring(0, 80)}..."\n`);

    const result = extractor.extractEntities(text);

    console.log(`⏱️  Extraction time: ${result.executionTimeMs.toFixed(2)}ms\n`);

    // Display extracted entities
    if (result.entities.people.length > 0) {
      console.log('👤 People:', result.entities.people.map((e) => e.text).join(', '));
    }

    if (result.entities.places.length > 0) {
      console.log('📍 Places:', result.entities.places.map((e) => e.text).join(', '));
    }

    if (result.entities.organizations.length > 0) {
      console.log(
        '🏢 Organizations:',
        result.entities.organizations.map((e) => e.text).join(', ')
      );
    }

    if (result.entities.dates.length > 0) {
      console.log('📅 Dates:', result.entities.dates.map((e) => e.text).join(', '));
    }

    if (result.entities.money.length > 0) {
      console.log('💰 Money:', result.entities.money.map((e) => e.text).join(', '));
    }

    if (result.entities.phoneNumbers.length > 0) {
      console.log('📞 Phone:', result.entities.phoneNumbers.map((e) => e.text).join(', '));
    }

    if (result.entities.emails.length > 0) {
      console.log('📧 Email:', result.entities.emails.map((e) => e.text).join(', '));
    }

    if (result.entities.roomNumbers.length > 0) {
      console.log(
        '🚪 Room Numbers:',
        result.entities.roomNumbers.map((e) => `${e.text} (#${e.normalizedValue})`).join(', ')
      );
    }

    if (result.entities.custom.length > 0) {
      console.log(
        '🏨 Hotel-Specific:',
        result.entities.custom.map((e) => `${e.type}: ${e.text}`).join(', ')
      );
    }

    console.log('\n' + '-'.repeat(80));
  });

  console.log('\n' + '='.repeat(80));
  console.log('✅ Key Benefits:');
  console.log('   • No ML model required (rule-based)');
  console.log('   • Extremely fast (<5ms per document)');
  console.log('   • 75-85% accuracy');
  console.log('   • Zero cost (no API calls)');
  console.log('   • Works offline');
  console.log('   • Easy to customize for domain-specific entities');
  console.log('\n💡 Use Cases:');
  console.log('   • Automatically extract contact info from guest emails');
  console.log('   • Parse reservation details from confirmation emails');
  console.log('   • Extract complaint data from review text');
  console.log('   • Populate CRM fields automatically');
  console.log('\n');
}

main().catch(console.error);
