export default function Main() {
  return (
    <div className="flex flex-col gap-y-10 w-full p-10 md:flex-row md:pb-0">
      <div className="md:w-1/2">
        <div className="flex flex-col gap-y-12 items-center justify-center">
          <h1 className="text-5xl w-fit flex justify-center flex-col gap-y-6 font-bold md:text-7xl">
            <span>6022</span>
            <span>Protocol</span>
          </h1>
          <p className="text-sm text-justify max-w-96 md:text-base">
            The 6022 Protocol is a revolutionary DeFi protocol designed to
            enhance trust and transparency between policyholders and insurance
            companies.
          </p>
        </div>
      </div>
      <div className="md:w-1/2 flex justify-center items-center">
        <h2 className="flex flex-col text-2xl font-medium text-center md:text-4xl">
          <span>Restoring trust</span>
          <span>in insurance industry</span>
        </h2>
      </div>
    </div>
  );
}
