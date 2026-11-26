/// <reference path="../pb_data/types.d.ts" />
// 방재사업본부가 계열사 k-UBIS로 분리됨 (11/26 한방유비스 검토의견)
// - 문의 분야 '방재제품'·담당 '방재사업본부' 없앰 (제품 문의는 k-UBIS로)
// - 사업분야 › 방재제품 메뉴 삭제 (계열사로 넘어간 사업은 대표홈페이지에 두지 않음)
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

  // 대표홈페이지에서는 계열사로 넘어간 사업을 보이지 않음 → 메뉴 삭제
  try { app.delete(app.findFirstRecordByFilter("menus", "slug = 'business/products'")); } catch (_) {}
}, (app) => {
  const iq = app.findCollectionByNameOrId("inquiries");
  const field = iq.fields.getByName("field"); if (!field.values.includes("방재제품")) field.values = [...field.values.filter((v) => v !== "기타"), "방재제품", "기타"];
  const dept = iq.fields.getByName("dept"); if (!dept.values.includes("방재사업본부")) dept.values = [...dept.values.filter((v) => v !== "경영지원팀"), "방재사업본부", "경영지원팀"];
  app.save(iq);
});
