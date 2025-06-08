import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer
      className="w-full py-4 text-center border-t"
      style={{
        backgroundColor: "#EAE4D5",
        borderColor: "#B6B09F",
      }}
    >
      <p
        className="text-sm font-medium flex items-center justify-center gap-2"
        style={{ color: "#000000" }}
      >
        made with ❤️ by shubham.
        <a
          href="https://github.com/Shubbu03"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center transition-all duration-200 hover:scale-110"
          style={{ color: "#000000" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#B6B09F";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#000000";
          }}
        >
          <Github className="w-4 h-4" />
        </a>
      </p>
    </footer>
  );
}
