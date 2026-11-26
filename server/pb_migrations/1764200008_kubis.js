/// <reference path="../pb_data/types.d.ts" />
// 방재사업본부가 계열사 k-UBIS로 분리됨 (11/26 한방유비스 검토의견)
// - 문의 분야 '방재제품'·담당 '방재사업본부' 없앰 (제품 문의는 k-UBIS로)
// - 사업분야 › 방재제품 메뉴 → k-UBIS 홈페이지 외부 링크 (주소 받기 전까지 숨김)
migrate((app) => {
  const iq = app.findCollectionByNameOrId("inquiries");
  const field = iq.fields.getByName("field"); field.values = field.values.filter((v) => v !== "방재제품");
  const dept = iq.fields.getByName("dept"); dept.values = dept.values.filter((v) => v !== "방재사업본부");
  app.save(iq);

  try {
    const st = app.findFirstRecordByFilter("site_settings", "id != ''");
    const de = JSON.parse(st.getString("dept_emails") || "{}"); delete de["방재사업본부"];
    st.set("dept_emails", de); app.save(st);
  } catch (_) {}

  try {
    const m = app.findFirstRecordByFilter("menus", "slug = 'business/products'");
    m.set("name_ko", "방재제품 (k-UBIS)"); m.set("name_en", "Products (k-UBIS)"); m.set("slug", "");
    m.set("link_type", "url"); m.set("target", ""); m.set("new_window", true); m.set("visible", false);
    app.save(m);
  } catch (_) {}
}, (app) => {
  const iq = app.findCollectionByNameOrId("inquiries");
  const field = iq.fields.getByName("field"); if (!field.values.includes("방재제품")) field.values = [...field.values.filter((v) => v !== "기타"), "방재제품", "기타"];
  const dept = iq.fields.getByName("dept"); if (!dept.values.includes("방재사업본부")) dept.values = [...dept.values.filter((v) => v !== "경영지원팀"), "방재사업본부", "경영지원팀"];
  app.save(iq);
});
