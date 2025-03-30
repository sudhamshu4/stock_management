import PropTypes from "prop-types";

const Button = ({ children, onClick, className }) => {
  return (
    <button className={`btn ${className}`} onClick={onClick}>
      {children}
    </button>
  );
};

// ✅ Add prop validation
Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

// ✅ Provide default props to avoid undefined errors
Button.defaultProps = {
  onClick: () => {},
  className: "",
};

export default Button;
