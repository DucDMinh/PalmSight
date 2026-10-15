import PageWrapper from "@/components/PageWrapper";

const Homepage = () => {
  return (
    <PageWrapper>
      <div className="component:Homepage flex flex-col items-center justify-center py-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          PalmSight
        </h1>
        <p className="mt-4 text-muted-foreground max-w-md">
          Nền tảng xem chỉ tay và luận giải vận mệnh thông minh.
        </p>
      </div>
    </PageWrapper>
  );
};

export default Homepage;
