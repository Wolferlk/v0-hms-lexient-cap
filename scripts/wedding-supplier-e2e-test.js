// Requires Node 18+ (fetch available)
// Usage: 1) Start Next dev server (e.g. `npm run dev`) 2) node scripts/wedding-supplier-e2e-test.js

const base = process.env.BASE_URL || 'http://localhost:3000';

async function req(path, opts = {}){
  const url = base + path;
  const res = await fetch(url, opts);
  const text = await res.text();
  let body;
  try{ body = JSON.parse(text); } catch(e){ body = text; }
  return { status: res.status, body };
}

async function main(){
  console.log('Testing wedding supplier flow against', base);

  // 1) Create supplier
  const supplierPayload = { name: 'Test Supplier', contact: 'test@supplier.local', phone: '0123456789', notes: 'Automated test supplier' };
  const supRes = await req('/api/inventory/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(supplierPayload) });
  console.log('Create Supplier ->', supRes.status, supRes.body);
  if(supRes.status !== 200 && supRes.status !== 201){ console.error('Failed to create supplier'); process.exit(1); }
  const supplier = supRes.body?.supplier || supRes.body;
  const supplierId = supplier?._id || supplier?.id;
  if(!supplierId){ console.error('No supplier id returned'); process.exit(1); }

  // 2) Create supplier-package
  const packagePayload = { supplierId, name: 'Basic Package', description: 'Test package', price: 1500 };
  const pkgRes = await req('/api/wedding-hall/supplier-packages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(packagePayload) });
  console.log('Create Supplier Package ->', pkgRes.status, pkgRes.body);
  if(pkgRes.status !== 200 && pkgRes.status !== 201){ console.error('Failed to create supplier package'); process.exit(1); }
  const pkg = pkgRes.body?.package || pkgRes.body;
  const supplierPackageId = pkg?._id || pkg?.id;
  if(!supplierPackageId){ console.error('No supplier package id returned'); process.exit(1); }

  // 3) Create a minimal quotation referencing the supplier and package
  const quotationPayload = {
    customer: { name: 'Test Customer', phone: '0987654321' },
    hallId: undefined, // optional: set a real hall id if you have one
    packages: [],
    supplierId,
    supplierPackageId,
    advancePaid: 0,
    payments: [],
  };

  const quoteRes = await req('/api/wedding-hall/quotations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(quotationPayload) });
  console.log('Create Quotation ->', quoteRes.status, quoteRes.body);
  if(quoteRes.status !== 200 && quoteRes.status !== 201){ console.error('Failed to create quotation'); process.exit(1); }
  const quotation = quoteRes.body?.quotation || quoteRes.body;
  console.log('Quotation created:', quotation?._id || quotation?.id);

  console.log('All steps completed successfully. Verify totals include supplierPackageAmount and supplierId/ supplierPackageId fields.');
}

main().catch(err => { console.error(err); process.exit(1); });
