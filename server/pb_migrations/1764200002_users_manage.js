/// <reference path="../pb_data/types.d.ts" />
// 최고 관리자가 다른 관리자 계정의 메일·비밀번호·인증 여부를 관리할 수 있게 (관리자 계정 화면용)
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.manageRule = "@request.auth.role.locked = true";
  app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  users.manageRule = null;
  app.save(users);
});
