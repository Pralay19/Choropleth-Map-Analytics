const Header = () => {
    return (
      <div
        style={{
          textAlign: "center",
          fontFamily: "'Poppins', sans-serif",
          padding: "30px",
          background: 'url("/images/wall7.png") center/cover no-repeat, #1a1a1a',
          backdropFilter: "20px",
          color: "white",
          borderRadius: "35px",
        }}
      >
        <div
          style={{
            fontSize: "36px",
            fontWeight: "bold",
            color: "#fff",
            textShadow: "0px 0px 10px rgba(0, 255, 255, 0.8), 0px 0px 20px rgba(0, 255, 255, 0.5)",
            paddingBottom: "10px",
          }}
        >
          <h2>Choropleth Map Analytics</h2>
        </div>
        <div
          style={{
            fontSize: "18px",
            marginTop: "10px",
            maxWidth: "600px",
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: "1.5",
            padding: "15px",
            background: "rgba(255, 255, 255, 0.1)",
            boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(5px)",
            borderRadius: "10px",
          }}
        >
          An End-to-End System for Reverse Engineering Choropleth Map Images
        </div>
      </div>
    )
  }
  
  export default Header
  