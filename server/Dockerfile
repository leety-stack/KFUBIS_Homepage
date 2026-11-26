FROM alpine:3.20
RUN apk add --no-cache unzip ca-certificates dos2unix tzdata
ENV TZ=Asia/Seoul
COPY pocketbase_0.39.4_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb && rm /tmp/pb.zip && chmod +x /pb/pocketbase
WORKDIR /pb
COPY pb_migrations ./pb_migrations
COPY pb_hooks ./pb_hooks
COPY entrypoint.sh ./entrypoint.sh
RUN dos2unix ./entrypoint.sh && chmod +x ./entrypoint.sh
EXPOSE 8090
ENTRYPOINT ["/pb/entrypoint.sh"]
